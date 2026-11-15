import type { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {variant?: "primary"|"secondary"};
/** Adaptador provisório até a publicação do workspace React do erikacarvalho-ds. */
export function Button({variant="primary",className="",...props}:Props){return <button className={`ec-button ec-button--${variant} ${className}`} {...props}/>}
