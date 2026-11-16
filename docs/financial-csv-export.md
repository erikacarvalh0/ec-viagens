# Financial report CSV

Only trip administrators can access the existing financial report and download its CSV export. The export contains participant names and balances already authorized on that page. CSV is UTF-8 with BOM, semicolon-delimited, and uses Brazilian currency formatting. User-provided names are escaped to prevent spreadsheet formula injection. No new endpoint or schema change.
