export const buttonClass = (isActive: boolean): string => {
    const base = 'rounded-md border px-4 py-2 text-sm cursor-pointer transition-colors font-[500]';

    return isActive
        ? `${base} bg-blue-600 border-blue-600 text-white`
        : `${base} bg-transparent border-[#2c3a52] text-[#aeb9ca] hover:bg-[#223052] hover:text-white`;
}

export const alertBase = 'rounded-lg px-3 py-2.5 mb-2 text-[13px] border';
export const alertError = `${alertBase} bg-[rgba(255,90,90,0.1)] border-[#8f2b33] text-[#ffb4b4]`;
export const alertOk = `${alertBase} bg-[rgba(60,220,130,0.1)] border-[#1f7a4d] text-[#7df0ab]`;
export const emptyText = 'text-[#8b96a8] text-sm';
export const alertInfo = `${alertBase} bg-[rgba(100,180,255,0.1)] border-[#3a7dbd] text-[#a3d4ff]`;

export const thClass = 'text-left px-2 py-1.5 border-b border-[#223047] text-[#8b96a8] font-semibold bg-[#233148]/30';
export const tdClass = 'text-left px-2 py-1.5 border-b border-[#223047] font-[600]';

export type BadgeVariant = 'ok' | 'error' | 'neutral';

export const badgeBase =
    'px-3.5 py-2 rounded-full font-semibold whitespace-nowrap text-sm border';
export const badgeVariants: Record<BadgeVariant, string> = {
    ok: 'bg-[#123f2a] text-[#5eeaa0] border-[#1f7a4d]',
    error: 'bg-[#471418] text-[#ff9a9a] border-[#8f2b33]',
    neutral: 'bg-[#1c2330] text-[#9aa4b2] border-[#2e3a4f]',
};
export const badgeClass = (variant: BadgeVariant) =>
    `${badgeBase} ${badgeVariants[variant]}`;

export const miniBtnClass =
    'bg-[#1a2230] border border-[#2c3a52] text-[#c9d3e0] rounded-lg px-2.5 py-1 text-xs cursor-pointer hover:bg-[#223052]';

export const searchInputClass =
    'bg-[#0b0f16] border border-[#2b3850] rounded-lg text-[#e6e9ee] px-2.5 py-2 text-[13px] w-full outline-none focus:border-blue-600 placeholder:text-[#5b6b84]';

export const panelBoxClass =
    'bg-[#0b0f16] border border-[#2b3850] rounded-lg px-3 py-2.5 text-[13px]';

export const astMetaClass = 'text-[#8b96a8] text-xs';

export const astCountClass =
    'text-[#8b96a8] text-[11px] border border-[#2c3a52] rounded-full px-[7px]';

export const astPillBase =
    'font-mono text-xs font-bold px-2 py-0.5 rounded-full border';
export const astPillKinds: Record<string, string> = {
    root: 'bg-[#1e2b4d] border-[#3b5bdb] text-[#bcd0ff]',
    statement: 'bg-[#123f2a] border-[#1f7a4d] text-[#7df0ab]',
    expression: 'bg-[#3a2a10] border-[#9a6b1f] text-[#ffd88a]',
    leaf: 'bg-[#2a2233] border-[#6d5b8f] text-[#d3c2ff]',
};
export const astPillClass = (kind: string) =>
    `${astPillBase} ${astPillKinds[kind] ?? astPillKinds.leaf}`;