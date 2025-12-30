
import { prebuiltAppConfig } from "@mlc-ai/web-llm";

console.log("Looking for Gemma models in prebuiltAppConfig...");
const gemmaModels = prebuiltAppConfig.model_list.filter(m => m.model_id.includes("gemma-2-2b"));

if (gemmaModels.length > 0) {
    console.log("Found Gemma Models:");
    gemmaModels.forEach(m => {
        console.log("--------------------------------");
        console.log(`Model ID: ${m.model_id}`);
        console.log(`Model Lib URL: ${m.model_lib_url}`);
        console.log(`VRAM: ${m.vram_required_MB}`);
    });
} else {
    console.log("No Gemma-2-2b models found in prebuilt config.");
    // Print all to see what's available
    console.log("All available models:");
    prebuiltAppConfig.model_list.forEach(m => console.log(m.model_id));
}
