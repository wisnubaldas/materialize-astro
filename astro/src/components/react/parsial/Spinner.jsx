export default function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="spinner-grow text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
