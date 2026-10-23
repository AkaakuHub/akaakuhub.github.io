const interactionClass =
  "inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f5f3e9] [&_svg]:pointer-events-none [&_svg]:size-4.5 [&_svg]:shrink-0";
export const controlClass = `${interactionClass} rounded-md border border-white/15 bg-[#171e1a]/45 text-[#f5f3e9]/85 backdrop-blur-md hover:border-white/40 hover:bg-[#171e1a]/70 hover:text-white`;
export const directionClass = `${interactionClass} relative size-13 flex-col gap-1 rounded-sm text-xs leading-none text-[#f5f3e9]/75 drop-shadow-[0_1px_3px_#000] after:absolute after:bottom-0 after:h-px after:w-4 after:bg-transparent hover:text-white aria-pressed:text-white aria-pressed:after:bg-[#f5f3e9]/85`;
export const leftClass = "left-[max(1rem,env(safe-area-inset-left))]";
export const rightClass = "right-[max(1rem,env(safe-area-inset-right))]";
export const topClass = "top-[max(1rem,env(safe-area-inset-top))]";
export const bottomClass = "bottom-[max(1rem,env(safe-area-inset-bottom))]";
