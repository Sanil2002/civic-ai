
// const Skeleton = () => {
//   return (
//     <div className="animate-pulse flex flex-col  gap-1">
//       <div className="h-2 bg-gray-300 rounded w-[450px]"></div>
//       <div className="h-2 bg-gray-300 rounded w-[600px]"></div>
//       <div className="h-2 bg-gray-300 rounded w-[700px]"></div>
//     </div>
//   );
// };

// export default Skeleton;
import React from 'react';

interface SkeletonProps {
  shape?: 'rectangle' | 'circle' | 'square'; // Allowable shapes
  text?: string; // Optional text to display while loading
  width?: string; // Width of the skeleton
  height?: string; // Height of the skeleton
}

const Skeleton: React.FC<SkeletonProps> = ({
  shape = 'rectangle',
  text = '',
  width = '100%',
  height = '20px',
}) => {
  // Shape styles
  const shapeStyles = {
    rectangle: 'rounded-md',
    circle: 'rounded-full',
    square: 'rounded-md',
  };

  // Dynamic styles based on props
  const style = {
    width,
    height,
  };

  return (
    <div className={`bg-gray-300 animate-pulse ${shapeStyles[shape]}`} style={style}>
      {text && (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          {text}
        </div>
      )}
    </div>
  );
};

export default Skeleton;

