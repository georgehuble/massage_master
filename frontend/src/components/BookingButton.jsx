export default function BookingButton({ disabled, onClick }) {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        className="w-full py-2 mt-4 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700"
      >
        Записаться
      </button>
    );
  }
  