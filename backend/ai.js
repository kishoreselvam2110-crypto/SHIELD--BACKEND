import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

export async function getTripPlan(destination, days, budget, language = "en") {
  try {
    if (groq) {
      const prompt = `Act as a professional travel architect. Generate a highly detailed and REALISTIC ${days}-day safety-first trip plan for ${destination} with a ${budget} budget.
      
      CRITICAL INSTRUCTIONS:
      1. You MUST generate exactly ${days} days in the "itinerary" array.
      2. For each day, include 3-4 activities with REAL names and precise GPS coordinates.
      3. Language: ${language === "hi" ? "Hindi" : "English"}.
      4. Return ONLY valid JSON matching this schema:
      {
        "destination": "${destination}",
        "summary": "A brief safety-aware overview of the trip",
        "itinerary": [
          {
            "day": 1,
            "theme": "Exploration",
            "activities": [
              { "name": "Place Name", "lat": 12.34, "lon": 56.78, "description": "Detailed info", "time": "09:00 AM" }
            ]
          }
        ]
      }`;

      const res = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      return JSON.parse(res.choices[0].message.content);
    }
    return null; // Let the server handle fallback
  } catch (err) {
    console.log("AI error:", err);
    return null;
  }
}
