import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import type { FormType } from "src/types";

const serverUrl = import.meta.env.VITE_API_BASE_URL;
interface Props {
  handleFetchMore: () => void;
  setIsPostEnd: (v: boolean) => void;
  setIsMessage: (v: string) => void;
  setIsError: (v: boolean) => void;
  isCopySelected: string[];
}

const Footer = ({
  handleFetchMore,
  setIsPostEnd,
  setIsMessage,
  setIsError,
  isCopySelected,
}: Props) => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const { watch } = useFormContext<FormType>();
  const isRandom = watch()?.isRandom;
  const isBest = isRandom?.filter((v) => v?.isBest);

  const onPostSelected = () => {
    const isTrue = isBest?.filter((v) =>
      isCopySelected?.includes(v.user?.psEntry)
    );
    const isFalse = watch()?.isRandom?.filter(
      (v) => !isCopySelected?.includes(v.user?.psEntry)
    );
    const selectedData = isTrue?.map((v) => ({
      psEntry: v.user.psEntry,
      doctorId: doctorId,
      op_date: v?.user?.op_data,
    }));
    const disSelectedData = isFalse?.map((u) => ({
      psEntry: u.user.psEntry,
      doctorId: doctorId,
      op_date: u?.user?.op_data,
    }));
    const req = [
      { selected: [...selectedData] },
      { unselected: [...disSelectedData] },
    ];
    fetch(`${serverUrl}/api/best`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    })
      .then((response) => response.json())
      .then(() => {
        setIsPostEnd(true);
        setIsMessage("베스트 리뷰로 선정했습니다.");
      })
      .catch((error) => {
        console.error("Error sending data:", error);
        setIsPostEnd(true);
        setIsError(true);
        setIsMessage("베스트 리뷰 선정을 실패했습니다.");
      });
    setIsPostEnd(false);
    setIsPostEnd(false);
  };

  return (
    <div className="w-full h-[80px] bg-white px-4 py-3 items-center flex justify-between gap-2 shadow-md">
      {/* <div className="flex items-center gap-1">
        <button
          className="text-[#ff6600]"
          onClick={() =>
            watch().isRandom?.map((_, idx) =>
              setValue(`isRandom.${idx}.isBest`, false)
            )
          }
        >
          <svg className="heart3 w-8 h-8">
            <use href="/src/assets/sprite.svg#heart3"></use>
          </svg>
        </button>
        <p className="text-[24px] text-gray-700">{count}</p>
      </div> */}
      {/* <div className="flex gap-4"> */}
      <button
        className="border-[1px] w-full py-3 rounded-lg border-[#ff6600]"
        onClick={handleFetchMore}
      >
        <p className="text-[17px] text-gray-700 font-bold">더보기</p>
      </button>
      <button
        className="border-[1px] w-full py-3 rounded-lg border-[#ff6600] bg-[#ff6600]"
        onClick={() => onPostSelected()}
      >
        <p className="text-[17px] text-white font-bold">확인</p>
      </button>
      {/* </div> */}
    </div>
  );
};
export default Footer;
