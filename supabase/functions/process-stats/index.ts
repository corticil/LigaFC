import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.22.0";
import { createClient } from "npm:@supabase/supabase-js@^2.108.2";

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);

const ALLOWED_MODELS = ["gemini-2.5-flash", "gemini-3.1-flash-lite"];
const DEFAULT_MODEL = "gemini-2.5-flash";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No se proporcionó ninguna imagen" }), { status: 400 });
    }

    const rawModel = formData.get("model")?.toString() || DEFAULT_MODEL;
    const modelId = ALLOWED_MODELS.includes(rawModel) ? rawModel : DEFAULT_MODEL;
    const model = genAI.getGenerativeModel({ model: modelId });

    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));

    const prompt = `Analiza la imagen de esta pantalla de estadísticas de fútbol. Extrae la información y organízala estrictamente en este formato JSON:
{
    "partido": {
        "local": "Nombre Local", "visitante": "Nombre Visitante", "goles_local": 0, "goles_visitante": 0, "tiempo": "00:00"
    },
    "estadisticas_tabla": {
        "Métrica": {"local": 0, "visitante": 0}
    },
    "rendimiento_general": {
        "local": {"exito_regates": "0%", "precision_tiros": "0%", "precision_pases": "0%"},
        "visitante": {"exito_regates": "0%", "precision_tiros": "0%", "precision_pases": "0%"}
    }
}`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: imageFile.type, data: base64Image } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);

    const { data, error } = await supabase.from("partidos_stats").insert({
      nombre_local: parsed.partido.local,
      nombre_visitante: parsed.partido.visitante,
      goles_local: parsed.partido.goles_local,
      goles_visitante: parsed.partido.goles_visitante,
      tiempo_partido: parsed.partido.tiempo,
      estadisticas_tabla: parsed.estadisticas_tabla,
      rendimiento_general: parsed.rendimiento_general,
    }).select("*").single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
