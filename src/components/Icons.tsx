import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 18): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const PlusIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const SearchIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const TrashIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
);
export const PinIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 17v5M9 10.76V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6.76l2 4.24H7l2-4.24Z" /></svg>
);
export const SettingsIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
);
export const SendIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>
);
export const StopIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></svg>
);
export const CloseIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const GlobeIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" /></svg>
);
export const PaperclipIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
);
export const BrainIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 5a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V8a3 3 0 0 0-3-3Z" /><path d="M9 8a3 3 0 0 0-3 3v1a3 3 0 0 0 2 2.83V18a2 2 0 0 0 2 2M15 8a3 3 0 0 1 3 3v1a3 3 0 0 1-2 2.83V18a2 2 0 0 1-2 2" /></svg>
);
export const ChatIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>
);
export const ChevronDown = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const RefreshIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></svg>
);
export const CopyIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);
export const CheckIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M20 6 9 17l-5-5" /></svg>
);
export const SparkleIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
export const EditIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
export const MinusIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 12h14" /></svg>
);
export const PlusMini = PlusIcon;

export const CompactIcon = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}>
    <path d="M4 9h16M4 15h16" />
    <path d="M9 3v4l3-2-3-2ZM15 21v-4l3 2-3 2Z" />
  </svg>
);
