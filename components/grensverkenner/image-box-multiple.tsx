import Image from 'next/image';

type ImageItem = {
  src: string;
  caption?: string;
};

type ImageBoxProps = {
  title?: string;
  height?: number;
  images: ImageItem[];
};


export function ImageBoxMultiple({ title, height = 64, images }: ImageBoxProps) {
  return (
    <div className="my-6">
      {/* Top caption */}
      {title && (
        <p className="mb-3 text-center text-sm italic text-muted-foreground">
          {title}
        </p>
      )}

      {/* Images */}
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((img, i) => (
          <div key={i} className="text-center">            
            <div className={`relative h-${height} w-full overflow-hidden rounded-lg`}>
              <Image
                src={img.src}
                alt={img.caption || `image-${i}`}
                fill
                className="object-cover"
              />
            </div>

            {/* Individual caption */}
            {img.caption && (
              <p className="mt-2 text-sm text-muted-foreground">
                {img.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
