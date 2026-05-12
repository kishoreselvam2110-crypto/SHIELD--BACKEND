import axios from "axios";

// ✅ Get places in a city
export async function getPlaces(city) {
  const url = "https://nominatim.openstreetmap.org/search";

  const response = await axios.get(url, {
    params: {
      q: city,
      format: "json",
      limit: 10
    },
    headers: {
      "User-Agent": "saviour-tourist-app"
    }
  });

  return response.data;
}

// ✅ Get single place details
export async function getPlaceDetails(placeName) {
  const url = "https://nominatim.openstreetmap.org/search";

  const response = await axios.get(url, {
    params: {
      q: placeName,
      format: "json",
      limit: 1
    },
    headers: {
      "User-Agent": "saviour-tourist-app"
    }
  });

  return response.data[0] || null;
}
