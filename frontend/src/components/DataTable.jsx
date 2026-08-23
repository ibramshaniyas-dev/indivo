import { useState } from 'react';
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Checkbox,
  TextField, InputAdornment, TablePagination, Toolbar, Typography, Button, CircularProgress,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

/**
 * Server-driven data table: the caller owns fetching (search/filter/sort/page all round-trip
 * to the API — see section 172, "do NOT fetch all records and filter in frontend"). This
 * component only renders what it's given and reports user intent back via callbacks.
 */
export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  loading,
  total = 0,
  page = 1,
  limit = 20,
  onPageChange,
  onLimitChange,
  onSearch,
  searchPlaceholder = 'Search…',
  filters,
  selectable = false,
  selected = [],
  onSelectionChange,
  bulkActions = [],
  rowActions,
  emptyState,
}) {
  const [searchValue, setSearchValue] = useState('');

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    onSelectionChange(allSelected ? [] : rows.map((r) => r[rowKey]));
  };
  const toggleOne = (id) => {
    onSelectionChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') onSearch(searchValue);
  };

  return (
    <Paper>
      <Toolbar sx={{ gap: 1.5, py: 1.5, flexWrap: 'wrap' }}>
        {onSearch && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => onSearch(searchValue)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 240 }}
          />
        )}
        {filters}
        <Box sx={{ flexGrow: 1 }} />
        {selected.length > 0 && bulkActions.length > 0 && (
          <>
            <Typography variant="body2" color="text.secondary">{selected.length} selected</Typography>
            {bulkActions.map((action) => (
              <Button key={action.label} size="small" color={action.color || 'primary'} onClick={() => action.onClick(selected)}>
                {action.label}
              </Button>
            ))}
          </>
        )}
      </Toolbar>

      <TableContainer sx={{ position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox indeterminate={someSelected} checked={allSelected} onChange={toggleAll} />
                </TableCell>
              )}
              {columns.map((col) => <TableCell key={col.key}>{col.label}</TableCell>)}
              {rowActions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} sx={{ border: 0 }}>
                  {emptyState || <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No records found</Typography>}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row[rowKey]} hover>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.includes(row[rowKey])} onChange={() => toggleOne(row[rowKey])} />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>{col.render ? col.render(row) : row[col.key]}</TableCell>
                  ))}
                  {rowActions && <TableCell align="right">{rowActions(row)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {onPageChange && (
        <TablePagination
          component="div"
          count={total}
          page={Math.max(page - 1, 0)}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(e, newPage) => onPageChange(newPage + 1)}
          onRowsPerPageChange={(e) => onLimitChange?.(Number(e.target.value))}
        />
      )}
    </Paper>
  );
}
