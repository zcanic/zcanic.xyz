/**
 * Conditionally joins CSS class names together.
 * Similar to the clsx or classnames libraries.
 * 
 * @param {...string|string[]|Object|undefined|null|false} args - Class names to combine
 * @returns {string} - Combined class string
 * 
 * @example
 * // returns "btn btn-primary"
 * cn("btn", "btn-primary")
 * 
 * @example
 * // returns "card dark large"
 * cn("card", { dark: true, large: true, hidden: false })
 * 
 * @example
 * // returns "nav nav-pills active"
 * cn("nav", ["nav-pills", isActive && "active"])
 */
export function cn(...args) {
  const classes = [];

  for (const arg of args) {
    if (!arg) continue;

    const argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = cn(...arg);
        if (inner) {
          classes.push(inner);
        }
      }
    } else if (argType === 'object') {
      for (const key in arg) {
        if (Object.hasOwnProperty.call(arg, key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
} 