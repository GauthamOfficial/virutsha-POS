import { useEffect, useState } from "react";
import { BiSolidDish } from "react-icons/bi";
import { MdCategory, MdSettings, MdPeople } from "react-icons/md";
import PageHeading from "../components/shared/PageHeading";
import DishManager from "../components/admin/DishManager";
import CategoryManager from "../components/admin/CategoryManager";
import SettingsManager from "../components/admin/SettingsManager";
import StaffManager from "../components/admin/StaffManager";

const tabs = [
  { key: "dishes", label: "Dishes", icon: <BiSolidDish size={18} /> },
  { key: "categories", label: "Categories", icon: <MdCategory size={18} /> },
  { key: "staff", label: "Staff", icon: <MdPeople size={18} /> },
  { key: "settings", label: "Settings", icon: <MdSettings size={18} /> },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dishes");

  useEffect(() => {
    document.title = "POS | Manage";
  }, []);

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <PageHeading
        title="Manage"
        subtitle="The menu, your staff and how the bill looks."
      />

      <div className="flex flex-wrap gap-2 px-4 md:px-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-[#f6b100] text-[#1f1f1f]"
                : "bg-[#1a1a1a] text-[#ababab] hover:text-[#f5f5f5]"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 px-4 md:px-8">
        {activeTab === "dishes" && <DishManager />}
        {activeTab === "categories" && <CategoryManager />}
        {activeTab === "staff" && <StaffManager />}
        {activeTab === "settings" && <SettingsManager />}
      </div>
    </section>
  );
};

export default Admin;
