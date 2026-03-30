import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "PLANTATION_UPLOADED_REPORTS";

type LocalReport = {
  referenceId: string;
  date?: string;
  village?: string;
  numberOfRows?: string | number;
  plantsPerRow?: string | number;
  speciesRows?: any[];
  naturalspeciesRows?: any[];
  protectionRows?: any[];
  locationRows?: any[];
  waterFacility?: string;
  reason?: string;
  images?: any[];
  createdAt?: string;
  uploadedAt?: string;
  serverId?: string | number;
};

const parseReports = (value: string | null): LocalReport[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getUploadedReports = async () => {
  const data = await AsyncStorage.getItem(KEY);
  return parseReports(data);
};

export const saveUploadedReport = async (report: LocalReport) => {
  const existing = await getUploadedReports();

  const filtered = existing.filter(
    (item) =>
      !(
        item.referenceId === report.referenceId &&
        item.date === report.date &&
        item.createdAt === report.createdAt
      ),
  );

  const nextReport = {
    ...report,
    images: Array.isArray(report.images) ? report.images : [],
  };

  await AsyncStorage.setItem(KEY, JSON.stringify([nextReport, ...filtered]));
};
