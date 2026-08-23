const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const slugify = require('../utils/slugify');
const { publicUrlFor, relativePathFromFile } = require('../services/storage.service');
const { createInventoryForVariant } = require('../services/inventory.service');

const CARD_SELECT = `
  SELECT p.id, p.public_id, p.name, p.slug, p.selling_price, p.mrp, p.status,
         b.name AS brand_name, s.display_name AS seller_name, s.id AS seller_id,
         (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image,
         (SELECT COALESCE(SUM(i.available_stock - i.reserved_stock), 0)
            FROM inventories i JOIN product_variants v ON v.id = i.product_variant_id WHERE v.product_id = p.id) AS stock,
         (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.status = 'APPROVED') AS rating,
         (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'APPROVED') AS review_count
  FROM products p
  JOIN sellers s ON s.id = p.seller_id
  LEFT JOIN brands b ON b.id = p.brand_id
`;

function toCard(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: row.image,
    brandName: row.brand_name,
    sellerName: row.seller_name,
    sellerId: row.seller_id,
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    mrp: Number(row.mrp),
    price: Number(row.selling_price),
    stockStatus: Number(row.stock) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
  };
}

async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 60);
    const offset = (page - 1) * limit;

    const conditions = ["p.status = 'ACTIVE'", "s.status = 'APPROVED'"];
    const params = {};

    if (req.query.q) {
      conditions.push('(p.name LIKE :q OR p.description LIKE :q)');
      params.q = `%${req.query.q}%`;
    }
    if (req.query.category) {
      conditions.push('p.category_id = :categoryId');
      params.categoryId = req.query.category;
    }
    if (req.query.brand) {
      conditions.push('p.brand_id = :brandId');
      params.brandId = req.query.brand;
    }
    if (req.query.seller) {
      conditions.push('p.seller_id = :sellerId');
      params.sellerId = req.query.seller;
    }
    if (req.query.minPrice) {
      conditions.push('p.selling_price >= :minPrice');
      params.minPrice = req.query.minPrice;
    }
    if (req.query.maxPrice) {
      conditions.push('p.selling_price <= :maxPrice');
      params.maxPrice = req.query.maxPrice;
    }

    const sortMap = {
      price_asc: 'p.selling_price ASC',
      price_desc: 'p.selling_price DESC',
      newest: 'p.created_at DESC',
      rating: 'rating DESC',
    };
    const orderBy = sortMap[req.query.sort] || 'p.is_featured DESC, p.created_at DESC';

    const where = `WHERE ${conditions.join(' AND ')}`;
    const products = await db.query(
      `${CARD_SELECT} ${where} ORDER BY ${orderBy} LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total FROM products p JOIN sellers s ON s.id = p.seller_id ${where}`,
      params
    );

    return success(res, { data: products.map(toCard), meta: { page, limit, total: Number(total) } });
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const product = await db.queryOne(
      `SELECT p.*, b.name AS brand_name, b.logo AS brand_logo,
              c.name AS category_name, c.id AS category_id,
              s.id AS seller_id, s.display_name AS seller_name, s.status AS seller_status
       FROM products p
       JOIN sellers s ON s.id = p.seller_id
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = :slug AND p.status = 'ACTIVE' AND s.status = 'APPROVED'`,
      { slug: req.params.slug }
    );
    if (!product) throw ApiError.notFound('Product not found');

    const [images, variants, ratingRow] = await Promise.all([
      db.query('SELECT id, url, variant_id, is_primary FROM product_images WHERE product_id = :id ORDER BY sort_order ASC', {
        id: product.id,
      }),
      db.query(
        `SELECT v.id, v.sku, v.price, v.mrp, v.barcode, v.status,
                COALESCE((SELECT SUM(i.available_stock - i.reserved_stock) FROM inventories i WHERE i.product_variant_id = v.id), 0) AS stock
         FROM product_variants v WHERE v.product_id = :id AND v.status = 'ACTIVE'`,
        { id: product.id }
      ),
      db.queryOne(
        "SELECT ROUND(AVG(rating),1) AS rating, COUNT(*) AS count FROM reviews WHERE product_id = :id AND status = 'APPROVED'",
        { id: product.id }
      ),
    ]);

    const variantIds = variants.map((v) => v.id);
    let variantAttributes = [];
    if (variantIds.length) {
      variantAttributes = await db.query(
        `SELECT pva.variant_id, a.name AS attribute_name, av.value
         FROM product_variant_attributes pva
         JOIN attributes a ON a.id = pva.attribute_id
         JOIN attribute_values av ON av.id = pva.attribute_value_id
         WHERE pva.variant_id IN (:variantIds)`,
        { variantIds }
      );
    }

    const variantsWithAttrs = variants.map((v) => ({
      ...v,
      price: Number(v.price),
      mrp: Number(v.mrp),
      attributes: variantAttributes.filter((a) => a.variant_id === v.id).map((a) => ({ name: a.attribute_name, value: a.value })),
    }));

    return success(res, {
      data: {
        ...product,
        mrp: Number(product.mrp),
        sellingPrice: Number(product.selling_price),
        images,
        variants: variantsWithAttrs,
        rating: Number(ratingRow?.rating) || 0,
        reviewCount: Number(ratingRow?.count) || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const conditions = ['p.seller_id = :sellerId'];
    const params = { sellerId: req.sellerId };
    if (req.query.status) {
      conditions.push('p.status = :status');
      params.status = req.query.status;
    }
    const products = await db.query(
      `SELECT p.id, p.name, p.slug, p.sku, p.selling_price, p.mrp, p.status, p.created_at,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image
       FROM products p WHERE ${conditions.join(' AND ')} ORDER BY p.created_at DESC`,
      params
    );
    return success(res, { data: products });
  } catch (err) {
    return next(err);
  }
}

async function getMineById(req, res, next) {
  try {
    const product = await db.queryOne('SELECT * FROM products WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.id,
      sellerId: req.sellerId,
    });
    if (!product) throw ApiError.notFound('Product not found');
    const [images, variants] = await Promise.all([
      db.query('SELECT * FROM product_images WHERE product_id = :id ORDER BY sort_order ASC', { id: product.id }),
      db.query(
        `SELECT v.*, COALESCE((SELECT SUM(available_stock) FROM inventories WHERE product_variant_id = v.id), 0) AS stock
         FROM product_variants v WHERE product_id = :id`,
        { id: product.id }
      ),
    ]);
    return success(res, { data: { ...product, images, variants } });
  } catch (err) {
    return next(err);
  }
}

async function uniqueSlug(name, excludeId) {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.queryOne(
      excludeId ? 'SELECT id FROM products WHERE slug = :slug AND id != :excludeId' : 'SELECT id FROM products WHERE slug = :slug',
      { slug, excludeId }
    );
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function create(req, res, next) {
  try {
    const {
      name, categoryId, brandId, sku, description, shortDescription, mrp, sellingPrice,
      taxRate, hsnCode, stock, returnPolicy, warranty,
    } = req.body;

    if (Number(sellingPrice) > Number(mrp)) {
      throw ApiError.badRequest('Selling price cannot be greater than MRP');
    }

    const slug = await uniqueSlug(name);
    const publicId = uuidv4();

    const productId = await db.transaction(async (tx) => {
      const result = await tx.query(
        `INSERT INTO products (public_id, seller_id, category_id, brand_id, name, slug, sku, description,
           short_description, mrp, selling_price, tax_rate, hsn_code, return_policy, warranty, status)
         VALUES (:publicId, :sellerId, :categoryId, :brandId, :name, :slug, :sku, :description,
           :shortDescription, :mrp, :sellingPrice, :taxRate, :hsnCode, :returnPolicy, :warranty, 'DRAFT')`,
        {
          publicId, sellerId: req.sellerId, categoryId, brandId: brandId || null, name, slug, sku,
          description: description || null, shortDescription: shortDescription || null, mrp, sellingPrice,
          taxRate: taxRate || 0, hsnCode: hsnCode || null, returnPolicy: returnPolicy || null, warranty: warranty || null,
        }
      );
      const newProductId = result.insertId;

      const variantResult = await tx.query(
        `INSERT INTO product_variants (product_id, sku, price, mrp) VALUES (:productId, :sku, :price, :mrp)`,
        { productId: newProductId, sku: `${sku}-DEFAULT`, price: sellingPrice, mrp }
      );

      await createInventoryForVariant(variantResult.insertId, req.sellerId, Number(stock) || 0, tx);

      return newProductId;
    });

    const product = await db.queryOne('SELECT * FROM products WHERE id = :id', { id: productId });
    return success(res, { status: 201, message: 'Product created as draft', data: product });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await db.queryOne('SELECT * FROM products WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.id,
      sellerId: req.sellerId,
    });
    if (!existing) throw ApiError.notFound('Product not found');

    const fields = { ...req.body };
    const slug = fields.name && fields.name !== existing.name ? await uniqueSlug(fields.name, existing.id) : existing.slug;

    await db.query(
      `UPDATE products SET name = :name, slug = :slug, category_id = :categoryId, brand_id = :brandId,
       description = :description, short_description = :shortDescription, mrp = :mrp, selling_price = :sellingPrice,
       tax_rate = :taxRate, hsn_code = :hsnCode, return_policy = :returnPolicy, warranty = :warranty
       WHERE id = :id`,
      {
        id: existing.id,
        name: fields.name ?? existing.name,
        slug,
        categoryId: fields.categoryId ?? existing.category_id,
        brandId: fields.brandId !== undefined ? fields.brandId || null : existing.brand_id,
        description: fields.description ?? existing.description,
        shortDescription: fields.shortDescription ?? existing.short_description,
        mrp: fields.mrp ?? existing.mrp,
        sellingPrice: fields.sellingPrice ?? existing.selling_price,
        taxRate: fields.taxRate ?? existing.tax_rate,
        hsnCode: fields.hsnCode ?? existing.hsn_code,
        returnPolicy: fields.returnPolicy ?? existing.return_policy,
        warranty: fields.warranty ?? existing.warranty,
      }
    );
    const product = await db.queryOne('SELECT * FROM products WHERE id = :id', { id: existing.id });
    return success(res, { message: 'Product updated', data: product });
  } catch (err) {
    return next(err);
  }
}

async function addVariant(req, res, next) {
  try {
    const product = await db.queryOne('SELECT id FROM products WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.id,
      sellerId: req.sellerId,
    });
    if (!product) throw ApiError.notFound('Product not found');

    const { sku, price, mrp, barcode, stock, attributes } = req.body;

    const variantId = await db.transaction(async (tx) => {
      const result = await tx.query(
        `INSERT INTO product_variants (product_id, sku, price, mrp, barcode) VALUES (:productId, :sku, :price, :mrp, :barcode)`,
        { productId: product.id, sku, price, mrp, barcode: barcode || null }
      );
      const newVariantId = result.insertId;

      if (Array.isArray(attributes)) {
        for (const attr of attributes) {
          await tx.query(
            `INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id)
             VALUES (:variantId, :attributeId, :attributeValueId)`,
            { variantId: newVariantId, attributeId: attr.attributeId, attributeValueId: attr.attributeValueId }
          );
        }
      }

      await createInventoryForVariant(newVariantId, req.sellerId, Number(stock) || 0, tx);
      return newVariantId;
    });

    const variant = await db.queryOne('SELECT * FROM product_variants WHERE id = :id', { id: variantId });
    return success(res, { status: 201, message: 'Variant added', data: variant });
  } catch (err) {
    return next(err);
  }
}

async function uploadImages(req, res, next) {
  try {
    const product = await db.queryOne('SELECT id FROM products WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.id,
      sellerId: req.sellerId,
    });
    if (!product) throw ApiError.notFound('Product not found');
    if (!req.files?.length) throw ApiError.badRequest('At least one image is required');

    const existingCount = await db.queryOne('SELECT COUNT(*) AS count FROM product_images WHERE product_id = :id', {
      id: product.id,
    });
    const hasPrimary = Number(existingCount.count) > 0;

    const images = [];
    for (let i = 0; i < req.files.length; i += 1) {
      const url = publicUrlFor(relativePathFromFile(req.files[i]));
      const result = await db.query(
        `INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES (:productId, :url, :sortOrder, :isPrimary)`,
        { productId: product.id, url, sortOrder: Number(existingCount.count) + i, isPrimary: !hasPrimary && i === 0 ? 1 : 0 }
      );
      images.push({ id: result.insertId, url });
    }
    return success(res, { status: 201, message: 'Images uploaded', data: images });
  } catch (err) {
    return next(err);
  }
}

async function submitForReview(req, res, next) {
  try {
    const product = await db.queryOne('SELECT * FROM products WHERE id = :id AND seller_id = :sellerId', {
      id: req.params.id,
      sellerId: req.sellerId,
    });
    if (!product) throw ApiError.notFound('Product not found');
    if (!['DRAFT', 'REJECTED'].includes(product.status)) {
      throw ApiError.conflict(`Cannot submit a product in status ${product.status}`);
    }
    const imageCount = await db.queryOne('SELECT COUNT(*) AS count FROM product_images WHERE product_id = :id', { id: product.id });
    if (Number(imageCount.count) === 0) throw ApiError.badRequest('Add at least one product image before submitting');

    await db.query("UPDATE products SET status = 'PENDING_REVIEW' WHERE id = :id", { id: product.id });
    return success(res, { message: 'Product submitted for review' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getBySlug, listMine, getMineById, create, update, addVariant, uploadImages, submitForReview };
