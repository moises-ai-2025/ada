// src/cohere-provider.ts
import {
  loadApiKey,
  withoutTrailingSlash
} from "@ai-sdk/provider-utils";

// src/cohere-chat-language-model.ts
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError3
} from "@ai-sdk/provider";
import {
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  postJsonToApi
} from "@ai-sdk/provider-utils";
import { z as z2 } from "zod";

// src/cohere-error.ts
import { createJsonErrorResponseHandler } from "@ai-sdk/provider-utils";
import { z } from "zod";
var cohereErrorDataSchema = z.object({
  message: z.string()
});
var cohereFailedResponseHandler = createJsonErrorResponseHandler({
  errorSchema: cohereErrorDataSchema,
  errorToMessage: (data) => data.message
});

// src/convert-to-cohere-chat-prompt.ts
import {
  UnsupportedFunctionalityError
} from "@ai-sdk/provider";
function convertToCohereChatPrompt(prompt) {
  const messages = [];
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        messages.push({ role: "system", content });
        break;
      }
      case "user": {
        messages.push({
          role: "user",
          content: content.map((part) => {
            switch (part.type) {
              case "text": {
                return part.text;
              }
              case "image": {
                throw new UnsupportedFunctionalityError({
                  functionality: "image-part"
                });
              }
            }
          }).join("")
        });
        break;
      }
      case "assistant": {
        let text = "";
        const toolCalls = [];
        for (const part of content) {
          switch (part.type) {
            case "text": {
              text += part.text;
              break;
            }
            case "tool-call": {
              toolCalls.push({
                id: part.toolCallId,
                type: "function",
                function: {
                  name: part.toolName,
                  arguments: JSON.stringify(part.args)
                }
              });
              break;
            }
            default: {
              const _exhaustiveCheck = part;
              throw new Error(`Unsupported part: ${_exhaustiveCheck}`);
            }
          }
        }
        messages.push({
          role: "assistant",
          // note: this is a workaround for a Cohere API bug
          // that requires content to be provided
          // even if there are tool calls
          content: text !== "" ? text : "call tool",
          tool_calls: toolCalls.length > 0 ? toolCalls : void 0,
          tool_plan: void 0
        });
        break;
      }
      case "tool": {
        messages.push(
          ...content.map((toolResult) => ({
            role: "tool",
            content: JSON.stringify(toolResult.result),
            tool_call_id: toolResult.toolCallId
          }))
        );
        break;
      }
      default: {
        const _exhaustiveCheck = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }
  return messages;
}

// src/map-cohere-finish-reason.ts
function mapCohereFinishReason(finishReason) {
  switch (finishReason) {
    case "COMPLETE":
    case "STOP_SEQUENCE":
      return "stop";
    case "MAX_TOKENS":
      return "length";
    case "ERROR":
    case "ERROR_LIMIT":
      return "error";
    case "ERROR_TOXIC":
      return "content-filter";
    case "USER_CANCEL":
      return "other";
    default:
      return "unknown";
  }
}

// src/cohere-prepare-tools.ts
import {
  UnsupportedFunctionalityError as UnsupportedFunctionalityError2
} from "@ai-sdk/provider";
function prepareTools(mode) {
  var _a;
  const tools = ((_a = mode.tools) == null ? void 0 : _a.length) ? mode.tools : void 0;
  const toolWarnings = [];
  if (tools == null) {
    return { tools: void 0, tool_choice: void 0, toolWarnings };
  }
  const cohereTools = [];
  for (const tool of tools) {
    if (tool.type === "provider-defined") {
      toolWarnings.push({ type: "unsupported-tool", tool });
    } else {
      cohereTools.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      });
    }
  }
  const toolChoice = mode.toolChoice;
  if (toolChoice == null) {
    return { tools: cohereTools, tool_choice: void 0, toolWarnings };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
      return { tools: cohereTools, tool_choice: type, toolWarnings };
    case "none":
      return { tools: void 0, tool_choice: "any", toolWarnings };
    case "required":
    case "tool":
      throw new UnsupportedFunctionalityError2({
        functionality: `Unsupported tool choice type: ${type}`
      });
    default: {
      const _exhaustiveCheck = type;
      throw new UnsupportedFunctionalityError2({
        functionality: `Unsupported tool choice type: ${_exhaustiveCheck}`
      });
    }
  }
}

// src/cohere-chat-language-model.ts
var CohereChatLanguageModel = class {
  constructor(modelId, settings, config) {
    this.specificationVersion = "v1";
    this.defaultObjectGenerationMode = void 0;
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }
  get provider() {
    return this.config.provider;
  }
  getArgs({
    mode,
    prompt,
    maxTokens,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    responseFormat,
    seed
  }) {
    const type = mode.type;
    const chatPrompt = convertToCohereChatPrompt(prompt);
    const baseArgs = {
      // model id:
      model: this.modelId,
      // model specific settings:
      // none
      // standardized settings:
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      max_tokens: maxTokens,
      temperature,
      p: topP,
      k: topK,
      seed,
      stop_sequences: stopSequences,
      // response format:
      response_format: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? { type: "json_object", schema: responseFormat.schema } : void 0,
      // messages:
      messages: chatPrompt
    };
    switch (type) {
      case "regular": {
        const { tools, tool_choice, toolWarnings } = prepareTools(mode);
        return {
          ...baseArgs,
          tools,
          warnings: toolWarnings
        };
      }
      case "object-json": {
        throw new UnsupportedFunctionalityError3({
          functionality: "object-json mode"
        });
      }
      case "object-tool": {
        throw new UnsupportedFunctionalityError3({
          functionality: "object-tool mode"
        });
      }
      default: {
        const _exhaustiveCheck = type;
        throw new UnsupportedFunctionalityError3({
          functionality: `Unsupported mode: ${_exhaustiveCheck}`
        });
      }
    }
  }
  concatenateMessageText(messages) {
    return messages.filter(
      (message) => "content" in message
    ).map((message) => message.content).join("");
  }
  /*
  Remove `additionalProperties` and `$schema` from the `parameters` object of each tool.
  Though these are part of JSON schema, Cohere chokes if we include them in the request.
  */
  // TODO(shaper): Look at defining a type to simplify the params here and a couple of other places.
  removeJsonSchemaExtras(tools) {
    return tools.map((tool) => {
      if (tool.type === "function" && tool.function.parameters && typeof tool.function.parameters === "object") {
        const { additionalProperties, $schema, ...restParameters } = tool.function.parameters;
        return {
          ...tool,
          function: {
            ...tool.function,
            parameters: restParameters
          }
        };
      }
      return tool;
    });
  }
  async doGenerate(options) {
    var _a, _b, _c, _d;
    const { warnings, ...args } = this.getArgs(options);
    args.tools = args.tools && this.removeJsonSchemaExtras(args.tools);
    const { responseHeaders, value: response } = await postJsonToApi({
      url: `${this.config.baseURL}/chat`,
      headers: combineHeaders(this.config.headers(), options.headers),
      body: args,
      failedResponseHandler: cohereFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        cohereChatResponseSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const { messages, ...rawSettings } = args;
    let text = (_c = (_b = (_a = response.message.content) == null ? void 0 : _a[0]) == null ? void 0 : _b.text) != null ? _c : "";
    return {
      text,
      toolCalls: response.message.tool_calls ? response.message.tool_calls.map((toolCall) => ({
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        // Cohere sometimes returns `null` for tool call arguments for tools
        // defined as having no arguments.
        args: toolCall.function.arguments.replace(/^null$/, "{}"),
        toolCallType: "function"
      })) : [],
      finishReason: mapCohereFinishReason(response.finish_reason),
      usage: {
        promptTokens: response.usage.tokens.input_tokens,
        completionTokens: response.usage.tokens.output_tokens
      },
      rawCall: {
        rawPrompt: {
          messages
        },
        rawSettings
      },
      response: {
        id: (_d = response.generation_id) != null ? _d : void 0
      },
      rawResponse: { headers: responseHeaders },
      warnings,
      request: { body: JSON.stringify(args) }
    };
  }
  async doStream(options) {
    const { warnings, ...args } = this.getArgs(options);
    args.tools = args.tools && this.removeJsonSchemaExtras(args.tools);
    const body = { ...args, stream: true };
    const { responseHeaders, value: response } = await postJsonToApi({
      url: `${this.config.baseURL}/chat`,
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: cohereFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        cohereChatChunkSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch
    });
    const { messages, ...rawSettings } = args;
    let finishReason = "unknown";
    let usage = {
      promptTokens: Number.NaN,
      completionTokens: Number.NaN
    };
    let pendingToolCallDelta = {
      toolCallId: "",
      toolName: "",
      argsTextDelta: ""
    };
    return {
      stream: response.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            var _a, _b;
            if (!chunk.success) {
              finishReason = "error";
              controller.enqueue({ type: "error", error: chunk.error });
              return;
            }
            const value = chunk.value;
            const type = value.type;
            switch (type) {
              case "content-delta": {
                controller.enqueue({
                  type: "text-delta",
                  textDelta: value.delta.message.content.text
                });
                return;
              }
              case "tool-call-start": {
                pendingToolCallDelta = {
                  toolCallId: value.delta.message.tool_calls.id,
                  toolName: value.delta.message.tool_calls.function.name,
                  argsTextDelta: value.delta.message.tool_calls.function.arguments
                };
                controller.enqueue({
                  type: "tool-call-delta",
                  toolCallId: pendingToolCallDelta.toolCallId,
                  toolName: pendingToolCallDelta.toolName,
                  toolCallType: "function",
                  argsTextDelta: pendingToolCallDelta.argsTextDelta
                });
                return;
              }
              case "tool-call-delta": {
                pendingToolCallDelta.argsTextDelta += value.delta.message.tool_calls.function.arguments;
                controller.enqueue({
                  type: "tool-call-delta",
                  toolCallId: pendingToolCallDelta.toolCallId,
                  toolName: pendingToolCallDelta.toolName,
                  toolCallType: "function",
                  argsTextDelta: value.delta.message.tool_calls.function.arguments
                });
                return;
              }
              case "tool-call-end": {
                controller.enqueue({
                  type: "tool-call",
                  toolCallId: pendingToolCallDelta.toolCallId,
                  toolName: pendingToolCallDelta.toolName,
                  toolCallType: "function",
                  args: JSON.stringify(
                    JSON.parse(
                      ((_a = pendingToolCallDelta.argsTextDelta) == null ? void 0 : _a.trim()) || "{}"
                    )
                  )
                });
                pendingToolCallDelta = {
                  toolCallId: "",
                  toolName: "",
                  argsTextDelta: ""
                };
                return;
              }
              case "message-start": {
                controller.enqueue({
                  type: "response-metadata",
                  id: (_b = value.id) != null ? _b : void 0
                });
                return;
              }
              case "message-end": {
                finishReason = mapCohereFinishReason(value.delta.finish_reason);
                const tokens = value.delta.usage.tokens;
                usage = {
                  promptTokens: tokens.input_tokens,
                  completionTokens: tokens.output_tokens
                };
              }
              default: {
                return;
              }
            }
          },
          flush(controller) {
            controller.enqueue({
              type: "finish",
              finishReason,
              usage
            });
          }
        })
      ),
      rawCall: {
        rawPrompt: {
          messages
        },
        rawSettings
      },
      rawResponse: { headers: responseHeaders },
      warnings,
      request: { body: JSON.stringify(body) }
    };
  }
};
var cohereChatResponseSchema = z2.object({
  generation_id: z2.string().nullish(),
  message: z2.object({
    role: z2.string(),
    content: z2.array(
      z2.object({
        type: z2.string(),
        text: z2.string()
      })
    ).nullish(),
    tool_plan: z2.string().nullish(),
    tool_calls: z2.array(
      z2.object({
        id: z2.string(),
        type: z2.literal("function"),
        function: z2.object({
          name: z2.string(),
          arguments: z2.string()
        })
      })
    ).nullish()
  }),
  finish_reason: z2.string(),
  usage: z2.object({
    billed_units: z2.object({
      input_tokens: z2.number(),
      output_tokens: z2.number()
    }),
    tokens: z2.object({
      input_tokens: z2.number(),
      output_tokens: z2.number()
    })
  })
});
var cohereChatChunkSchema = z2.discriminatedUnion("type", [
  z2.object({
    type: z2.literal("citation-start")
  }),
  z2.object({
    type: z2.literal("citation-end")
  }),
  z2.object({
    type: z2.literal("content-start")
  }),
  z2.object({
    type: z2.literal("content-delta"),
    delta: z2.object({
      message: z2.object({
        content: z2.object({
          text: z2.string()
        })
      })
    })
  }),
  z2.object({
    type: z2.literal("content-end")
  }),
  z2.object({
    type: z2.literal("message-start"),
    id: z2.string().nullish()
  }),
  z2.object({
    type: z2.literal("message-end"),
    delta: z2.object({
      finish_reason: z2.string(),
      usage: z2.object({
        tokens: z2.object({
          input_tokens: z2.number(),
          output_tokens: z2.number()
        })
      })
    })
  }),
  // https://docs.cohere.com/v2/docs/streaming#tool-use-stream-events-for-tool-calling
  z2.object({
    type: z2.literal("tool-plan-delta"),
    delta: z2.object({
      message: z2.object({
        tool_plan: z2.string()
      })
    })
  }),
  z2.object({
    type: z2.literal("tool-call-start"),
    delta: z2.object({
      message: z2.object({
        tool_calls: z2.object({
          id: z2.string(),
          type: z2.literal("function"),
          function: z2.object({
            name: z2.string(),
            arguments: z2.string()
          })
        })
      })
    })
  }),
  // A single tool call's `arguments` stream in chunks and must be accumulated
  // in a string and so the full tool object info can only be parsed once we see
  // `tool-call-end`.
  z2.object({
    type: z2.literal("tool-call-delta"),
    delta: z2.object({
      message: z2.object({
        tool_calls: z2.object({
          function: z2.object({
            arguments: z2.string()
          })
        })
      })
    })
  }),
  z2.object({
    type: z2.literal("tool-call-end")
  })
]);

// src/cohere-embedding-model.ts
import {
  TooManyEmbeddingValuesForCallError
} from "@ai-sdk/provider";
import {
  combineHeaders as combineHeaders2,
  createJsonResponseHandler as createJsonResponseHandler2,
  postJsonToApi as postJsonToApi2
} from "@ai-sdk/provider-utils";
import { z as z3 } from "zod";
var CohereEmbeddingModel = class {
  constructor(modelId, settings, config) {
    this.specificationVersion = "v1";
    this.maxEmbeddingsPerCall = 96;
    this.supportsParallelCalls = true;
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }
  get provider() {
    return this.config.provider;
  }
  async doEmbed({
    values,
    headers,
    abortSignal
  }) {
    var _a;
    if (values.length > this.maxEmbeddingsPerCall) {
      throw new TooManyEmbeddingValuesForCallError({
        provider: this.provider,
        modelId: this.modelId,
        maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
        values
      });
    }
    const { responseHeaders, value: response } = await postJsonToApi2({
      url: `${this.config.baseURL}/embed`,
      headers: combineHeaders2(this.config.headers(), headers),
      body: {
        model: this.modelId,
        // The AI SDK only supports 'float' embeddings which are also the only ones
        // the Cohere API docs state are supported for all models.
        // https://docs.cohere.com/v2/reference/embed#request.body.embedding_types
        embedding_types: ["float"],
        texts: values,
        input_type: (_a = this.settings.inputType) != null ? _a : "search_query",
        truncate: this.settings.truncate
      },
      failedResponseHandler: cohereFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler2(
        cohereTextEmbeddingResponseSchema
      ),
      abortSignal,
      fetch: this.config.fetch
    });
    return {
      embeddings: response.embeddings.float,
      usage: { tokens: response.meta.billed_units.input_tokens },
      rawResponse: { headers: responseHeaders }
    };
  }
};
var cohereTextEmbeddingResponseSchema = z3.object({
  embeddings: z3.object({
    float: z3.array(z3.array(z3.number()))
  }),
  meta: z3.object({
    billed_units: z3.object({
      input_tokens: z3.number()
    })
  })
});

// src/cohere-provider.ts
function createCohere(options = {}) {
  var _a;
  const baseURL = (_a = withoutTrailingSlash(options.baseURL)) != null ? _a : "https://api.cohere.com/v2";
  const getHeaders = () => ({
    Authorization: `Bearer ${loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: "COHERE_API_KEY",
      description: "Cohere"
    })}`,
    ...options.headers
  });
  const createChatModel = (modelId, settings = {}) => new CohereChatLanguageModel(modelId, settings, {
    provider: "cohere.chat",
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createTextEmbeddingModel = (modelId, settings = {}) => new CohereEmbeddingModel(modelId, settings, {
    provider: "cohere.textEmbedding",
    baseURL,
    headers: getHeaders,
    fetch: options.fetch
  });
  const provider = function(modelId, settings) {
    if (new.target) {
      throw new Error(
        "The Cohere model function cannot be called with the new keyword."
      );
    }
    return createChatModel(modelId, settings);
  };
  provider.languageModel = createChatModel;
  provider.embedding = createTextEmbeddingModel;
  provider.textEmbeddingModel = createTextEmbeddingModel;
  return provider;
}
var cohere = createCohere();
export {
  cohere,
  createCohere
};
//# sourceMappingURL=index.mjs.map