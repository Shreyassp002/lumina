import Header from "./Header";
import Footer from "./Footer";
import { OfflineIndicator } from "./OfflineIndicator";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <OfflineIndicator />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
