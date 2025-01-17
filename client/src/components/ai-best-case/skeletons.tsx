import { Skeleton } from "antd";

const Skeletons = () => {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div
          className="w-full px-4 py-4 bg-white rounded-lg flex flex-col shadow-md"
          key={i}
        >
          <div className="grid grid-cols-2 w-full gap-x-2">
            <Skeleton.Node
              active
              fullSize
              style={{
                height: 140,
              }}
            />
            <Skeleton.Node
              active
              fullSize
              style={{
                height: 140,
              }}
            />
          </div>
          <Skeleton.Node
            active
            fullSize
            style={{ height: 24 }}
            className="py-1 w-6 skeleton-button"
          />
          <div className="grid grid-cols-2 gap-1 h-[40px]">
            <Skeleton.Node active fullSize style={{ height: 18 }} />
            <Skeleton.Node active fullSize style={{ height: 18 }} />
            <Skeleton.Node active fullSize style={{ height: 18 }} />
            <Skeleton.Node active fullSize style={{ height: 18 }} />
          </div>
        </div>
      ))}
    </>
  );
};
export default Skeletons;
