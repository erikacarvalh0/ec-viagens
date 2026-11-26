'use client';
import { Button as UpstreamButton } from '@erikacarvalho/react/Button';
import { Button as NativeButton, type ButtonProps } from './primitives/Button';
export function EcdsButton({type='button',disabled,onClick,children,variant='primary',size='md',className='',...rest}:ButtonProps){
 if(Object.keys(rest).length) return <NativeButton {...rest} type={type} disabled={disabled} onClick={onClick} variant={variant} size={size} className={className}>{children}</NativeButton>;
 return <UpstreamButton type={type} isDisabled={disabled} action={onClick??(()=>{})} theme={variant==='primary'?'cta':'neutral'} customClass={['ec-button','ec-button--'+variant,'ec-button--'+size,className].join(' ')}>{children}</UpstreamButton>;
}
