import { ReactNode } from "react";
import Navbar from "./Navbar";

const PageLayout = ({ children }: { children: ReactNode }) => (
  <div className="gradient-bg grid-overlay min-h-screen">
    <Navbar />
    <main className="pt-16">{children}</main>
  </div>
);

export default PageLayout;
