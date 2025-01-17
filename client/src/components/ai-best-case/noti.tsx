import { useEffect } from "react";
import { notification } from "antd";

interface Props {
  isOpen: boolean;
  isMessage: string;
  isError: boolean;
  setIsError: (v: boolean) => void;
  setIsPostEnd: (v: boolean) => void;
}

const Noti = ({
  isOpen,
  isMessage,
  isError,
  setIsError,
  setIsPostEnd,
}: Props) => {
  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.open({
      icon: (
        <svg
          className={`heart3 w-6 h-6 ${
            isError ? "text-red-500" : "text-[#4CAF50]"
          }`}
        >
          <use href="/src/assets/sprite.svg#heart3"></use>
        </svg>
      ),
      description: (
        <p
          className={`text-[14px] font-semibold whitespace-pre-line ${
            isError ? "text-red-500" : "text-[#4CAF50]"
          }`}
        >
          {isMessage}
        </p>
      ),
      placement: "bottom",
      message: null,
      key: JSON.stringify(isOpen),
      closable: false,
      duration: 1.5,
      style: {
        backgroundColor: isError ? "#FBE9E7" : "#E0F2F1",
        padding: "10px 10px 10px 10px",
      },
      onClose: () => {
        setIsPostEnd(false);
        setIsError(false);
      },
    });
  };

  useEffect(() => {
    if (isOpen) {
      openNotification();
    }
  }, [isOpen]);

  return <>{contextHolder}</>;
};

export default Noti;
