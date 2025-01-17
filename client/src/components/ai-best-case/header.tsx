import { useFormContext } from "react-hook-form";
import type { FormType } from "src/types";

interface Props {
  doctorName: string;
  selectedCount: number;
  prevYear: number;
  prevMonth: number;
}

const Header = ({ doctorName, selectedCount, prevYear, prevMonth }: Props) => {
  const { watch } = useFormContext<FormType>();
  const count = watch()?.isRandom?.filter((v) => v?.isBest).length;

  return (
    <div className="py-3 px-4 w-full flex justify-between shadow-md items-center">
      <div className="flex items-center gap-x-1">
        <img
          src="/src/assets/doctor.png"
          className="w-6 h-6 border-[1px] border-gray-400 rounded-full"
        />
        <p className="text-[14px] text-gray-700 font-semibold">{doctorName}</p>
      </div>
      <div className="flex items-center">
        <p className="text-[16px] text-gray-700 font-semibold">
          {`AI 베스트 리뷰 - ${prevYear}년 ${prevMonth}월`}
        </p>
      </div>
      <div className="flex items-center gap-x-1">
        {/* <button className="text-[#ff6600]"> */}
        <svg className="heart3 w-6 h-6 text-[#ff6600]">
          <use href="/src/assets/sprite.svg#heart3"></use>
        </svg>
        {/* </button> */}
        <p className="text-[14px] text-gray-700 font-semibold normal-nums mb-1">
          {selectedCount}/3
        </p>
      </div>
    </div>
  );
};
export default Header;
