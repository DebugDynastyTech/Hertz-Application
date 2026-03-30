import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config/apiConfig";
import { getToken } from "../utils/auth";

/**
 * Fetch plantation entries
 */
const MASTER_KEY = "MASTER_DATA";

export const fetchEntries = async (forceRefresh = false) => {
  try {
    if (!forceRefresh) {
      const localData = await AsyncStorage.getItem(MASTER_KEY);

      if (localData) {
        return JSON.parse(localData);
      }
    }

    const token = await getToken();

    const res = await fetch(`${BASE_URL}/masters/index.php`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch entries");
    }

    await AsyncStorage.setItem(MASTER_KEY, JSON.stringify(data));

    return data;
  } catch (err) {
    console.log("Fetch entries error:", err);
    throw err;
  }
};

/**
 * Create new entry with images
 */
export const createEntry = async (
  data: any,
  images: any[] = [],
  imageLocations: any[] = [],
) => {
  const token = await getToken();

  try {
    // STEP 1: Create entry (existing API)
    const body = {
      reference_id: data.referenceId,
      monitoring_date: data.date,
      village_name: data.village,
      no_of_rows: Number(data.numberOfRows),
      plants_in_one_row: Number(data.plantsPerRow),
      water_facility: data.waterFacility,
      reason: data.reason,

      species: data.speciesRows,
      natural_species: data.naturalspeciesRows,
      protection_wall: data.protectionRows,
      locations: data.locationRows,
    };

    const res = await fetch(`${BASE_URL}/data-entries/create.php`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (!res.ok || result?.ok === false) {
      throw new Error(
        result?.error || result?.message || "Entry creation failed",
      );
    }

    // STEP 2: Upload images
    if (images?.length) {
      const formData = new FormData();
      formData.append("reference_id", data.referenceId);

      images.forEach((img, index) => {
        formData.append("images[]", {
          uri: img.uri,
          name: `photo_${index}.jpg`,
          type: "image/jpeg",
        } as any);

        formData.append(`latitudes[]`, imageLocations[index].latitude);
        formData.append(`longitudes[]`, imageLocations[index].longitude);
      });

      await fetch(`${BASE_URL}/data-entries/upload-images.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    }

    return result;
  } catch (err) {
    console.log("Create entry error:", err);
    throw err;
  }
};
