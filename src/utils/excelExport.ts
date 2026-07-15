import XLSX from 'xlsx-js-style';
import { WarehouseEntry, FixedAssetRecord } from '../types';

/**
 * Helper to convert 0-indexed row and col numbers to Excel cell references (e.g. 0,0 -> A1)
 */
function getCellRef(row: number, col: number): string {
  let temp = "";
  let c = col;
  while (c >= 0) {
    temp = String.fromCharCode((c % 26) + 65) + temp;
    c = Math.floor(c / 26) - 1;
  }
  return temp + (row + 1);
}

/**
 * Sanitizes and truncates a string to make it a valid Excel sheet name.
 * Excel sheet names:
 * - Must be <= 31 characters
 * - Cannot contain characters: \ / ? * [ ] :
 * - Cannot be blank
 */
export function sanitizeSheetName(name: string, fallback: string = 'Sheet'): string {
  if (!name || name.trim() === '') {
    return fallback;
  }
  // Replace forbidden characters with spaces or hyphens
  let cleanName = name.replace(/[\\/?*[\]:]/g, '-').trim();
  // Truncate to 31 characters
  if (cleanName.length > 31) {
    cleanName = cleanName.substring(0, 31);
  }
  return cleanName || fallback;
}

/**
 * Exports Warehouse list grouped by Department (Owner) into a multi-sheet Excel file.
 */
export function exportWarehouseToExcel(entries: WarehouseEntry[]) {
  if (entries.length === 0) return;

  const wb = XLSX.utils.book_new();

  // Group entries by Owner (Department)
  const groups: { [key: string]: WarehouseEntry[] } = {};
  entries.forEach((entry) => {
    const ownerName = entry.owner.trim() || 'Unspecified Owner';
    if (!groups[ownerName]) {
      groups[ownerName] = [];
    }
    groups[ownerName].push(entry);
  });

  // Track sheet names to prevent duplicates after sanitization
  const usedSheetNames = new Set<string>();

  Object.entries(groups).forEach(([ownerName, groupEntries]) => {
    // Generate valid sheet name
    let sheetName = sanitizeSheetName(ownerName, 'Department');
    let counter = 1;
    const baseName = sheetName;
    while (usedSheetNames.has(sheetName.toLowerCase())) {
      const suffix = ` (${counter})`;
      sheetName = baseName.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedSheetNames.add(sheetName.toLowerCase());

    // Prepare table rows (AOA - Array of Arrays)
    const data: any[][] = [];

    // Title Row
    data.push([`የመጋዘን ንብረት መዝገብ - ${ownerName} / Warehouse Inventory List - ${ownerName}`]);
    data.push([]); // Blank separator

    // Headers Row (Bilingual)
    data.push([
      'ተ.ቁ / S.No',
      'የንብረት ዓይነት / Asset Type',
      'ብዛት / Quantity',
      'የንብረቱ ባለቤት / Owner',
      'المستودع ቁጥር / Warehouse No.',
      'የመጋዘን ሃላፊ / Warehouse Manager',
      'የገባበት ቀን / Date',
      'ምርመራ / Inspection'
    ]);

    // Add entry rows
    groupEntries.forEach((entry, idx) => {
      data.push([
        entry.sNo || (idx + 1),
        entry.assetType,
        entry.quantity,
        entry.owner,
        entry.warehouseNo,
        entry.manager,
        entry.date,
        entry.inspection
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Populate empty cells so we can style them
    const totalRows = data.length;
    const totalCols = 8; // Columns A to H
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const ref = getCellRef(r, c);
        if (!ws[ref]) {
          ws[ref] = { t: 's', v: '' };
        }
      }
    }

    const thinBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };

    // Apply styles to all cells
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const ref = getCellRef(r, c);
        const cell = ws[ref];
        if (!cell) continue;

        cell.s = {
          font: { name: 'Times New Roman', sz: 10, color: { rgb: '000000' } },
          alignment: { vertical: 'center' }
        };

        if (r === 0) {
          // Title
          cell.s.font.bold = true;
          cell.s.font.sz = 13;
          cell.s.alignment.horizontal = 'center';
        } else if (r === 2) {
          // Headers
          cell.s.font.bold = true;
          cell.s.font.sz = 10;
          cell.s.alignment.horizontal = 'center';
          cell.s.alignment.wrapText = true;
          cell.s.border = thinBorder;
          cell.s.fill = { fgColor: { rgb: 'F8FAFC' } };
        } else if (r >= 3) {
          // Data
          cell.s.border = thinBorder;
          if (c === 0 || c === 6) {
            // S/No & Date
            cell.s.alignment.horizontal = 'center';
          } else if (c === 2) {
            // Quantity
            cell.s.alignment.horizontal = 'right';
            if (typeof cell.v === 'number') {
              cell.z = '#,##0';
            }
          } else {
            cell.s.alignment.horizontal = 'left';
          }
        }
      }
    }

    // Merge Title row across columns A to H
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
    ];

    // Configure column widths dynamically to autofit the longest text
    const colWidths = [10, 25, 12, 20, 20, 22, 14, 28]; // Minimum widths
    const startMeasuringRow = 2; // Header row
    const endMeasuringRow = totalRows - 1;

    for (let c = 0; c < 8; c++) {
      let maxLen = colWidths[c];
      for (let r = startMeasuringRow; r <= endMeasuringRow; r++) {
        const val = data[r][c];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      }
      colWidths[c] = maxLen + 3;
    }

    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    // Set row heights
    ws['!rows'] = [
      { hpt: 26 }, // Title
      { hpt: 15 }, // Spacer
      { hpt: 24 }  // Header
    ];
    for (let r = 3; r < totalRows; r++) {
      ws['!rows'].push({ hpt: 20 });
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Generate date stamp for file name
  const dateStr = new Date().toISOString().split('T')[0];
  const firstOwner = entries[0]?.owner?.trim() || '';
  const prefix = firstOwner ? `${firstOwner.replace(/[\/\\?*:[\] ]/g, '_')}_` : '';
  XLSX.writeFile(wb, `${prefix}Warehouse_Inventory_Export_${dateStr}.xlsx`);
}

export function exportFixedAssetsToExcel(records: FixedAssetRecord[]) {
  if (records.length === 0) return;

  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  records.forEach((record) => {
    // Determine sheet name: e.g. "IT - Abebe"
    const dept = record.header.department.trim() || 'Dept';
    const name = record.header.employeeName.trim() || 'Employee';
    const proposedName = `${dept} - ${name}`;
    
    let sheetName = sanitizeSheetName(proposedName, 'Employee Asset');
    let counter = 1;
    const baseName = sheetName;
    while (usedSheetNames.has(sheetName.toLowerCase())) {
      const suffix = ` (${counter})`;
      sheetName = baseName.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedSheetNames.add(sheetName.toLowerCase());

    // Prepare AOA data matching the exact template layout from the image
    const data: any[][] = [];

    // Title Row 1
    data.push(['The Federal Dimocratic Republic Of Ethiopia']);
    // Title Row 2
    data.push(['Ministry of Agriculture']);
    // Title Row 3
    data.push(['Fixed asset Inventory by Employe']);

    // Title rows have 12 columns. Let's pad them with empty strings so SheetJS reads them fully
    for (let i = 0; i < 3; i++) {
      while (data[i].length < 12) {
        data[i].push('');
      }
    }

    // Row 4 (index 3): Name of Employee & Department / section
    data.push([
      'Name of Employee: ' + record.header.employeeName,
      '',
      '',
      '',
      'Dapertment /section: ' + record.header.department,
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    // Row 5 (index 4): Employee No
    data.push([
      'Employee No: ' + record.header.employeeNo,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    // Row 6 (index 5): Column Headers (Top row of double-level header)
    data.push([
      'S/No',
      'Asset Description',
      'Tag No.',
      'Location',
      'Location',
      'Location',
      'Location',
      'Unit',
      'Cost',
      'Serial Number',
      'Received',
      'Received'
    ]);

    // Row 7 (index 6): Column Headers (Bottom row of double-level header)
    data.push([
      '',
      '',
      '',
      'Area',
      'Building',
      'Floor',
      'Specific Loc',
      '',
      '',
      '',
      'Yes',
      'No'
    ]);

    // Row 8 (index 7)+: Data Rows
    record.rows.forEach((row, idx) => {
      const yesValue = row.received === 'Yes' || row.received === 'Yes (አዎ)' ? 'Yes' : '';
      const noValue = row.received === 'No' || row.received === 'No (አይደለም)' ? 'No' : '';
      
      data.push([
        row.sNo || (idx + 1),
        row.assetDescription,
        row.tagNo,
        row.area,
        row.building,
        row.floor,
        row.specificLocation,
        row.unit,
        row.cost,
        row.serialNo,
        yesValue,
        noValue
      ]);
    });

    // Blank row spacer
    data.push([]);

    // Counted by & Username / Signature Rows
    data.push([
      'Counted by: ' + (record.countedBy || ''),
      '',
      '',
      '',
      'Username: ' + (record.username || ''),
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    data.push([
      '',
      '',
      '',
      '',
      'Signature: ________________________',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Initialize all grid area cells so we can apply styling (borders/fonts) to everything
    const totalRows = data.length;
    const totalCols = 12; // Column A to L
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const ref = getCellRef(r, c);
        if (!ws[ref]) {
          ws[ref] = { t: 's', v: '' };
        }
      }
    }

    const thinBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };

    // Apply exact visual formatting styles
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const ref = getCellRef(r, c);
        const cell = ws[ref];
        if (!cell) continue;

        // Default cell layout styling
        cell.s = {
          font: { name: 'Times New Roman', sz: 10, color: { rgb: '000000' } },
          alignment: { vertical: 'center' }
        };

        if (r >= 0 && r <= 2) {
          // Document Titles
          cell.s.font.bold = true;
          cell.s.font.sz = r === 0 ? 14 : (r === 1 ? 12 : 11);
          cell.s.alignment.horizontal = 'center';
        } else if (r === 3 || r === 4) {
          // Metadata (Name, Department, ID)
          cell.s.font.bold = true;
          cell.s.font.sz = 11;
          cell.s.alignment.horizontal = 'left';
        } else if (r === 5 || r === 6) {
          // Double-row Header Grid cells
          cell.s.font.bold = true;
          cell.s.font.sz = 10;
          cell.s.alignment.horizontal = 'center';
          cell.s.alignment.wrapText = true;
          cell.s.border = thinBorder;
          cell.s.fill = { fgColor: { rgb: 'FFFFFF' } };
        } else if (r >= 7 && r < totalRows - 3) {
          // Main records data table
          cell.s.border = thinBorder;
          
          // Column-specific text positioning
          if (c === 0) {
            cell.s.alignment.horizontal = 'center'; // S/No
          } else if (c === 7) {
            cell.s.alignment.horizontal = 'center'; // Unit
          } else if (c === 8) {
            cell.s.alignment.horizontal = 'right';  // Cost
            if (typeof cell.v === 'number') {
              cell.z = '#,##0.00';
            }
          } else if (c === 10 || c === 11) {
            cell.s.alignment.horizontal = 'center'; // Yes/No Received
          } else {
            cell.s.alignment.horizontal = 'left';   // Descriptions, Tag, Area, Building, Floor, Serial
          }
        } else if (r >= totalRows - 2) {
          // Signatures and Analyst usernames
          cell.s.font.bold = true;
          cell.s.font.sz = 11;
          cell.s.alignment.horizontal = 'left';
        }
      }
    }

    // Apply exact horizontal & vertical merges based on the indices
    // 0-indexed:
    // row 0: merge A0 to L0 (0 to 11)
    // row 1: merge A1 to L1 (0 to 11)
    // row 2: merge A2 to L2 (0 to 11)
    // row 5 & 6 (indices 5 & 6):
    //   - Col 0 (S/No) vertically merged (row 5-6)
    //   - Col 1 (Asset Description) vertically merged (row 5-6)
    //   - Col 2 (Tag No.) vertically merged (row 5-6)
    //   - Col 3 to 6 (Location) horizontally merged in row 5
    //   - Col 7 (Unit) vertically merged (row 5-6)
    //   - Col 8 (Cost) vertically merged (row 5-6)
    //   - Col 9 (Serial Number) vertically merged (row 5-6)
    //   - Col 10 to 11 (Received) horizontally merged in row 5
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } },
      
      // Double header merges
      { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } }, // S/No
      { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } }, // Asset Description
      { s: { r: 5, c: 2 }, e: { r: 6, c: 2 } }, // Tag No.
      { s: { r: 5, c: 3 }, e: { r: 5, c: 6 } }, // Location (Area to Specific Loc)
      { s: { r: 5, c: 7 }, e: { r: 6, c: 7 } }, // Unit
      { s: { r: 5, c: 8 }, e: { r: 6, c: 8 } }, // Cost
      { s: { r: 5, c: 9 }, e: { r: 6, c: 9 } }, // Serial Number
      { s: { r: 5, c: 10 }, e: { r: 5, c: 11 } } // Received (Yes/No)
    ];

    ws['!merges'] = merges;

    // Set precise column widths dynamically to autofit the longest text
    const colWidths = [8, 30, 18, 15, 15, 10, 22, 10, 12, 22, 8, 8]; // Minimum widths
    const startMeasuringRow = 5;
    const endMeasuringRow = 7 + record.rows.length - 1;

    for (let c = 0; c < 12; c++) {
      let maxLen = colWidths[c];
      for (let r = startMeasuringRow; r <= endMeasuringRow; r++) {
        // Skip merged headers horizontally spanning multiple cells in row index 5
        if (r === 5 && c >= 3 && c <= 6) continue;
        if (r === 5 && c >= 10 && c <= 11) continue;

        const val = data[r][c];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      }
      colWidths[c] = maxLen + 3;
    }

    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    // Set precise row heights matching standard print layouts
    const rowHeights: any[] = [
      { hpt: 22 }, // Title Row 1
      { hpt: 22 }, // Title Row 2
      { hpt: 22 }, // Title Row 3
      { hpt: 20 }, // Metadata 1
      { hpt: 20 }, // Metadata 2
      { hpt: 24 }, // Header row 1
      { hpt: 24 }  // Header row 2
    ];
    // Fill heights for data rows
    for (let r = 7; r < totalRows - 3; r++) {
      rowHeights.push({ hpt: 20 });
    }
    // Spacer and footer
    rowHeights.push({ hpt: 15 }); // Spacer
    rowHeights.push({ hpt: 22 }); // Signatures Line 1
    rowHeights.push({ hpt: 22 }); // Signatures Line 2

    ws['!rows'] = rowHeights;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const firstRecordDept = records[0]?.header?.department?.trim() || '';
  const prefix = firstRecordDept ? `${firstRecordDept.replace(/[\/\\?*:[\] ]/g, '_')}_` : '';
  XLSX.writeFile(wb, `${prefix}Fixed_Assets_Export_${dateStr}.xlsx`);
}

/**
 * Groups fixed asset records by department and downloads separate Excel files for each department.
 */
export function exportFixedAssetsByDepartment(records: FixedAssetRecord[]) {
  if (records.length === 0) return;

  const groups: { [dept: string]: FixedAssetRecord[] } = {};
  records.forEach((record) => {
    const dept = record.header.department.trim() || 'Unspecified Department';
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(record);
  });

  Object.values(groups).forEach((deptRecords) => {
    exportFixedAssetsToExcel(deptRecords);
  });
}
