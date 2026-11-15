import { forwardRef, type SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className = "", ...rest }, ref) {
    const classes = ["ec-select", className].filter(Boolean).join(" ");

    return <select ref={ref} className={classes} {...rest} />;
  },
);
