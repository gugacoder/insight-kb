# GPT-5 Integration Request

## Objective
Add support for all GPT-5 models to the LibreChat system.

## Models to Add
- gpt-5
- gpt-5-turbo
- Any other GPT-5 variants that become available

## Implementation Requirements

1. **Token Pricing Configuration**
   - Add GPT-5 models to the token pricing structure in `api/models/tx.js`
   - Configure appropriate prompt and completion rates per 1M tokens
   - Add support for any GPT-5 specific features (cache tokens if applicable)

2. **Model Detection**
   - Update the `getValueKey` function to properly detect GPT-5 model variants
   - Ensure all GPT-5 model name patterns are recognized

3. **Endpoint Configuration**
   - Add GPT-5 models to the OpenAI endpoint configuration
   - Update model manifests to include GPT-5 variants
   - Configure token limits specific to GPT-5 models

4. **User Interface**
   - Ensure GPT-5 models appear in model selection dropdowns
   - Update any hardcoded model lists in the frontend

5. **Validation and Permissions**
   - Add GPT-5 to allowed model lists
   - Configure any access controls or feature flags for GPT-5

## Notes
- Verify all configuration files that reference available models
- Test that GPT-5 models are properly recognized and accessible
- Ensure cost calculations work correctly with the new models