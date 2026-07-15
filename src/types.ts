export interface WarehouseEntry {
  id: string;
  sNo: number; // Item sequence number
  assetType: string; // የንብረት ዓይነት
  quantity: number | string; // ብዛት
  owner: string; // የንብረቱ ባለቤት (Department / Owner)
  warehouseNo: string; // የመጋዘን ቁጥር
  manager: string; // የመጋዘን ሃላፊ
  date: string; // የገባበት ቀን
  inspection: string; // ምርመራ (Inspection details/status)
}

export interface FixedAssetHeader {
  employeeName: string; // የሰራተኛው ሙሉ ስም
  department: string; // ክፍል / የሥራ ክፍል (Department)
  employeeNo: string; // የመታወቂያ ቁጥር / Employee ID
}

export interface FixedAssetRow {
  id: string;
  sNo: number; // ተ.ቁ / S.No
  assetDescription: string; // የንብረት መግለጫ
  tagNo: string; // የቋሚ ንብረት መለያ ቁጥር / Tag No.
  area: string; // አካባቢ / Area
  building: string; // ህንፃ / Building;
  floor: string; // ፎቅ / Floor
  specificLocation: string; // ልዩ ቦታ / Specific Location
  unit: string; // መለኪያ / Unit (e.g. Pcs, Set, Kg)
  cost: string | number; // ዋጋ / Cost
  serialNo: string; // የማሽን መለያ ቁጥር / Serial Number
  received: 'Yes' | 'No' | string; // የተረከበ / Received (አዎ / አይደለም)
}

export interface FixedAssetRecord {
  id: string;
  header: FixedAssetHeader;
  rows: FixedAssetRow[];
  countedBy: string; // ቆጠራውን ያካሄደው ባለሙያ ስም
  username: string; // ያረጋገጠው ኃላፊ ስም
  date: string; // የቀን ቆጠራ / Date
}
