import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";

const Modal = ({ isOpen, onClose, title, children, wide = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-[#1a1a1a] shadow-xl scrollbar-hide ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#333] bg-[#1a1a1a] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#ababab] transition hover:text-red-400"
            aria-label="Close"
          >
            <IoMdClose size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
};

export default Modal;
