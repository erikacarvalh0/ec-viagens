import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ invalid = false, className = "", ...rest }, ref) {
    const classes = [
      "ec-input",
      invalid ? "ec-input--invalid" : "",
      className,
    ].filter(Boolean).join(" ");

    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={classes}
        {...rest}
      />
    );
  },
);
