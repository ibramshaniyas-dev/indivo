-- Repeated calls to syncShipmentStatus() re-insert every activity from Shiprocket's tracking
-- API on each poll, with no dedup — the admin panel's "Refresh Tracking" button would otherwise
-- duplicate the timeline on every click. A natural key on (shipment_id, status, tracked_at)
-- lets INSERT IGNORE make repeat syncs idempotent.

-- Collapse any duplicates already produced by prior manual test syncs before the constraint
-- can be added (ALTER TABLE fails if duplicate rows already exist).
DELETE t1 FROM shipment_tracking t1
INNER JOIN shipment_tracking t2
  ON t1.shipment_id = t2.shipment_id
 AND t1.status = t2.status
 AND t1.tracked_at = t2.tracked_at
 AND t1.id > t2.id;

ALTER TABLE shipment_tracking
  ADD UNIQUE KEY uq_shipment_tracking_event (shipment_id, status, tracked_at);
