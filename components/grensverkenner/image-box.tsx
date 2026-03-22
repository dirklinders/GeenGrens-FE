import Image from 'next/image';
import { cn } from '@/lib/utils';

type ImageBoxProps = {
  src: string;
  caption?: string;
  title?: string;
  className?: string;
};

export function ImageBox({ src, caption, title, className }: ImageBoxProps) {
  return (
    <figure className={cn('my-6', className)}>
      {/* Optional top title */}
      {title && (
        <p className="mb-3 text-center text-sm italic text-muted-foreground">
          {title}
        </p>
      )}

      {/* Image container with rounded corners */}
      <div className="w-full overflow-hidden rounded-2xl">
        <Image
          src={src}
          alt={caption || 'image'}
          width={1200}         // original image width
          height={800}         // original image height
          style={{ width: '100%', height: 'auto' }} // full width, auto scale height
        />
      </div>

      {/* Optional bottom caption */}
      {caption && (
        <figcaption className="mt-2 text-center text-sm italic text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}