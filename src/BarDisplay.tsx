import { Immutable, MessageEvent, PanelExtensionContext, Topic, SettingsTreeAction } from "@foxglove/studio";
import { useEffect, useLayoutEffect, useState, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import { set } from "lodash";

import BarLevelIndicator from './components/BarLevelIndicator';

type Config = {
  topicField?: string;
  minValue?: number;
  maxValue?: number;
  barColor?: string;
  orientation?: 'horizontal' | 'vertical';
};

// Helper function to parse topic.field format
function parseTopicField(topicField: string | undefined): { topic: string; field: string } {
  if (!topicField) {
    return { topic: '', field: '' };
  }
  const parts = topicField.split('.');
  if (parts.length < 2) {
    return { topic: topicField, field: '' };
  }
  const topic = parts[0] || '';
  const field = parts.slice(1).join('.');
  return { topic, field };
}

// Helper function to extract value from nested object using dot notation
function getNestedValue(obj: any, path: string | undefined): any {
  if (!path) return obj;
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}


function BarDisplay({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<undefined | Immutable<Topic[]>>();
  const [messages, setMessages] = useState<undefined | Immutable<MessageEvent[]>>();
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  const [scalarValue, setScalarValue] = useState<number | undefined>();

  // Init config variable
  const [config, setConfig] = useState<Config>(() => {
    const partialConfig = context.initialState as Config;

    const {
      topicField = "",
      minValue = 0,
      maxValue = 100,
      barColor = "#00ff00",
      orientation = "horizontal",
    } = partialConfig;

    return { topicField, minValue, maxValue, barColor, orientation };
  });

  // Parse topic and field from topicField
  const { topic: currentTopic, field: currentField } = useMemo(() => {
    return parseTopicField(config.topicField);
  }, [config.topicField]);

  // Generate topic.field suggestions based on available topics
  const topicFieldSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    (topics ?? []).forEach(topic => {
      // Add the base topic
      suggestions.push(topic.name);
      // Add common field patterns
      const commonFields = ['data', 'value', 'x', 'y', 'z', 'position', 'velocity', 'temperature', 'pressure'];
      commonFields.forEach(field => {
        suggestions.push(`${topic.name}.${field}`);
      });
    });
    return suggestions;
  }, [topics]);

  const actionHandler = useCallback(
    (action: SettingsTreeAction) => {
      if (action.action === "update") {
        const { path, value } = action.payload;

        // Update config based on the previous config
        setConfig((previous) => {
          const newConfig = { ...previous };
          set(newConfig, path.slice(1), value);
          return newConfig;
        });
      }
    },
    [context],
  );

  // update setting editor when config or topics change
  useEffect(() => {
    context.saveState(config);

    context.updatePanelSettingsEditor({
      actionHandler,
      nodes: {
        general: {
          label: "General",
          icon: "Cube",
          fields: {
            topicField: {
              label: "Topic.Field",
              input: "string",
              placeholder: "e.g., /my_topic.data or /sensor.temperature",
              value: config.topicField,
            },
            minValue: {
              label: "Min Value",
              input: "number",
              value: config.minValue,
            },
            maxValue: {
              label: "Max Value",
              input: "number",
              value: config.maxValue,
            },
            barColor: {
              label: "Bar Color (Hex)",
              input: "string",
              placeholder: "e.g., #00ff00, #ff0000",
              value: config.barColor,
            },
            orientation: {
              label: "Orientation",
              input: "select",
              options: [
                { value: "horizontal", label: "Horizontal" },
                { value: "vertical", label: "Vertical" },
              ],
              value: config.orientation,
            },
          },
        },
      },
    });
  }, [context, actionHandler, config, topicFieldSuggestions]);

  // Subscribe to wanted topics
  useEffect(() => {
    context.saveState(config);
    let topicsList: { topic: string }[] = [];

    if (currentTopic) {
      topicsList.push({ topic: currentTopic });
    }
    context.subscribe(topicsList);
  }, [context, config, currentTopic]);

  // Main Layout effect
  useLayoutEffect(() => {
    context.onRender = (renderState, done) => {
      setRenderDone(() => done);

      setMessages(renderState.currentFrame);
      setTopics(renderState.topics);
    };

    context.watch("topics");
    context.watch("currentFrame");

  }, [context]);

  useEffect(() => {
    if (messages && currentTopic) {
      for (const message of messages) {
        if (message.topic === currentTopic) {
          const messageData = message.message as any;
          let value: number | undefined;
          
          if (currentField) {
            // Extract value using dot notation field path
            const extractedValue = getNestedValue(messageData, currentField);
            if (typeof extractedValue === 'number') {
              value = extractedValue;
            }
          } else {
            // Fallback to automatic field detection if no field specified
            if (typeof messageData === 'number') {
              value = messageData;
            } else if (messageData && typeof messageData === 'object') {
              // Look for common numeric fields
              const numericFields = ['value', 'data', 'x', 'y', 'z', 'position', 'velocity', 'temperature', 'pressure'];
              for (const field of numericFields) {
                if (typeof messageData[field] === 'number') {
                  value = messageData[field];
                  break;
                }
              }
              // If no common field found, try to get the first numeric property
              if (value === undefined) {
                for (const key in messageData) {
                  if (typeof messageData[key] === 'number') {
                    value = messageData[key];
                    break;
                  }
                }
              }
            }
          }
          
          setScalarValue(value);
        }
      }
    }
  }, [messages, currentTopic, currentField]);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  // Calculate percentage based on min/max values
  const percentage = useMemo(() => {
    if (scalarValue === undefined || config.minValue === undefined || config.maxValue === undefined) {
      return 0;
    }
    const range = config.maxValue - config.minValue;
    if (range === 0) return 0;
    const normalizedValue = Math.max(0, Math.min(100, ((scalarValue - config.minValue) / range) * 100));
    return normalizedValue;
  }, [scalarValue, config.minValue, config.maxValue]);

  return (
    <div style={{ 
      padding: "1rem", 
      borderRadius: "0.5rem",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <BarLevelIndicator 
        level={percentage} 
        color={config.barColor || "#00ff00"}
        value={scalarValue}
        orientation={config.orientation || "horizontal"}
      />
    </div>
  );
}

export function initBarDisplay(context: PanelExtensionContext): () => void {
  ReactDOM.render(<BarDisplay context={context} />, context.panelElement);

  // Return a function to run when the panel is removed
  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}
