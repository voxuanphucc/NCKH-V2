import React from 'react';

interface DarkenedImageProps {
  src: string;
  alt: string;
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
  [key: string]: any;
}

/**
 * Component để hiển thị hình ảnh với hiệu ứng làm đậm
 * 
 * @param src - Đường dẫn hình ảnh
 * @param alt - Văn bản thay thế
 * @param intensity - Mức độ làm đậm: 'subtle' (nhẹ), 'normal' (trung bình), 'strong' (mạnh)
 * @param className - CSS class bổ sung
 * 
 * @example
 * // Làm đậm nhẹ
 * <DarkenedImage src={homePageImage} alt="Home" intensity="subtle" />
 * 
 * // Làm đậm bình thường
 * <DarkenedImage src={homePageImage} alt="Home" intensity="normal" />
 * 
 * // Làm đậm mạnh
 * <DarkenedImage src={homePageImage} alt="Home" intensity="strong" />
 */
const DarkenedImage: React.FC<DarkenedImageProps> = ({
  src,
  alt,
  intensity = 'normal',
  className = '',
  ...props
}) => {
  const intensityMap = {
    subtle: 'image-darker-subtle',
    normal: 'image-darker',
    strong: 'image-darker-strong'
  };

  return (
    <img
      src={src}
      alt={alt}
      className={`${intensityMap[intensity]} ${className}`}
      {...props}
    />
  );
};

export default DarkenedImage;
