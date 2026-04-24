import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const SelectContext = React.createContext(null);

export const Select = ({ children, value, onValueChange, name, required }) => {
  const [internalValue, setInternalValue] = React.useState(value || "");

  React.useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const handleValueChange = (val) => {
    setInternalValue(val);
    if (onValueChange) onValueChange(val);
  };

  // Find all SelectItem values and labels from children
  const options = React.useMemo(() => {
    const items = [];
    const findItems = (nodes) => {
      React.Children.forEach(nodes, node => {
        if (!node) return;
        if (node.props?.value !== undefined && node.props?.children) {
          items.push({ value: node.props.value, label: node.props.children });
        } else if (node.props?.children) {
          findItems(node.props.children);
        }
      });
    };
    findItems(children);
    return items;
  }, [children]);

  return (
    <SelectContext.Provider value={{ value: internalValue, onValueChange: handleValueChange, name, required, options }}>
      <div className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ className, children, ...props }) => {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  return (
    <div className="relative">
      <select
        name={context.name}
        required={context.required}
        value={context.value || ""}
        onChange={(e) => context.onValueChange(e.target.value)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-medium pr-10",
          className
        )}
        {...props}
      >
        <option value="" disabled hidden>Sila Pilih...</option>
        {context.options.map((opt, i) => (
          <option key={i} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
    </div>
  );
};

export const SelectValue = () => null;
export const SelectContent = () => null;
export const SelectItem = () => null;
