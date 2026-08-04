import Image from "next/image";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-screen w-full place-items-center bg-[#111114] px-6 text-[#e1ddba]"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="relative grid size-24 place-items-center sm:size-28">
        <span className="absolute inset-0 rounded-full border border-[#e1ddba]/20 border-t-[#de3b43] motion-safe:animate-spin motion-safe:[animation-duration:1.8s] motion-reduce:animate-none" />
        <Image
          src="/branding/P&K_ICON.png"
          alt=""
          width={2847}
          height={3207}
          priority
          className="size-14 object-contain sm:size-16"
        />
      </div>
    </div>
  );
}
