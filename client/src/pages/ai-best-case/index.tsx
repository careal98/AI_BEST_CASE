import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { List, Header, Footer, Noti } from "src/components/ai-best-case";
import type { CheckedType, DataType, FormType } from "src/types";

const limit = 3;

export function AI_BEST_CASE() {
  const [searchParams] = useSearchParams();
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const doctorId = searchParams.get("doctorId");

  const linkYear = parseInt(year ?? "", 10);
  const linkMonth = parseInt(month ?? "", 10);

  // Date 객체를 생성
  const date = new Date(linkYear, linkMonth - 1, 1);
  date.setMonth(date.getMonth() - 2);

  // 결과 계산
  const prevYear = date.getFullYear();
  const prevMonth = date.getMonth() + 1;

  const [data, setData] = useState<DataType[]>([]);
  const [checekdData, setCheckedData] = useState<CheckedType[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPostEnd, setIsPostEnd] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isMessage, setIsMessage] = useState("");
  const [isCopySelected, setIsCopySelected] = useState<string[]>([]);

  const metods = useForm<FormType>({
    defaultValues: {
      isRandom: data?.map((v: DataType) => ({
        isBest: isCopySelected.includes(v.user.psEntry) ? true : false,
        user: v.user,
        imgs: {
          afterImgs: v?.imgs?.afterImgs,
          beforeImgs: v?.imgs?.beforeImgs,
        },
        size: {
          before: v?.size?.before,
          after: v?.size?.after,
        },
        weight: {
          before: v?.weight?.before,
          after: v?.weight?.after,
        },
      })),
    },
  });
  const { reset } = metods;

  // 데이터 가져오기 함수
  const fetchData = async (offset: number) => {
    // const offset = data.length;
    try {
      const response = await fetch(
        `/server/api/data/?year=${year}&month=${month}&doctorId=${doctorId}&offset=${offset}&limit=${limit}`,
        {
          method:'GET',
          mode: 'no-cors',
        }
      );
      const result = await response.json();
      console.log('res', result);

      return result;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // 스크롤 감지
  // const { ref, inView } = useInView({
  //   initialInView: false,
  //   onChange: (inView) => {
  //     if (inView && hasMore && !isLoading) {
  //       setIsLoading(true);
  //       fetchData()
  //         .then((newData) => {
  //           if (newData) {
  //             setData((prev) =>
  //               typeof prev !== "undefined"
  //                 ? [...prev, ...newData]
  //                 : [...newData]
  //             );
  //             // setPage((prev) => prev + 1);
  //             if (newData.length < limit) {
  //               setHasMore(false);
  //             }
  //           }
  //         })
  //         .finally(() => {
  //           setIsLoading(false);
  //         });
  //     }
  //   },
  // });

  const handleFetchMore = () => {
    if (hasMore && !isLoading) {
      setIsLoading(true);
      fetchData(data.length)
        .then((newData) => {
          if (newData) {
            setData((prev) => [...prev, ...newData]);
            if (newData.length < limit) {
              setHasMore(false);
            }
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const checkData = async () => {
    try {
      const response = await fetch(
        `/server/api/check/count/?year=${year}&month=${month}&doctorId=${doctorId}`,
        {
          method:'GET',
          mode: 'no-cors',
        }
      );
      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    reset({
      isRandom: data?.map((v: DataType) => ({
        isBest: isCopySelected.includes(v.user.psEntry) ? true : false,
        user: v.user,
        imgs: {
          afterImgs: v?.imgs?.afterImgs,
          beforeImgs: v?.imgs?.beforeImgs,
        },
        size: {
          before: v?.size?.before,
          after: v?.size?.after,
        },
        weight: {
          before: v?.weight?.before,
          after: v?.weight?.after,
        },
      })),
    });
  }, [data]);

  useEffect(() => {
    checkData().then((res) => {
      setCheckedData(res);
    });
  }, []);

  useEffect(() => {
    handleFetchMore();
  }, []);

  useEffect(() => {
    const arr = new Set(checekdData?.map((v) => v.psEntry));
    setIsCopySelected([...arr]);
  }, [checekdData]);

  return (
    <FormProvider {...metods}>
      <div className="flex overflow-hidden flex-col mx-auto w-full h-full items-center max-w-[480px] bg-white shadow-[0_35px_60px_-15px_rgba(0,4,0,0.4)]">
        <Header
          doctorName={data?.[0]?.user?.doctorName}
          selectedCount={isCopySelected?.length}
          prevYear={prevYear}
          prevMonth={prevMonth}
        />
        <List
          isCopySelected={isCopySelected}
          setIsCopySelected={setIsCopySelected}
          selectedData={checekdData}
          isLoading={isLoading}
          setIsMessage={setIsMessage}
          setIsPostEnd={setIsPostEnd}
          setIsError={setIsError}
        />
        <Footer
          isCopySelected={isCopySelected}
          handleFetchMore={handleFetchMore}
          setIsPostEnd={setIsPostEnd}
          setIsMessage={setIsMessage}
          setIsError={setIsError}
        />
        <Noti
          key={`${JSON.stringify(isPostEnd)}}`}
          isOpen={isPostEnd}
          setIsPostEnd={setIsPostEnd}
          isMessage={isMessage}
          isError={isError}
          setIsError={setIsError}
        />
      </div>
    </FormProvider>
  );
}
