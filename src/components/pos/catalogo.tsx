"use client";

import React, { useState } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

import { CatalogItem } from "@/types/pos";
import { PALETTE, currency } from "./constants";
import { useTranslations } from "@/lib/i18n";

export default function CatalogoView({
  catalog,
  setCatalog,
}: {
  catalog: CatalogItem[];
  setCatalog: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  }) {
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState<CatalogItem | null>(null);
    const t = useTranslations();

  const handleSave = (item: CatalogItem) => {
    if (currentItem) {
      setCatalog(catalog.map((c) => (c.id === item.id ? item : c)));
    } else {
      setCatalog([...catalog, { ...item, id: `item-${Date.now()}` }]);
    }
    setShowModal(false);
    setCurrentItem(null);
  };

  const handleDelete = (id: string) => {
    setCatalog(catalog.filter((c) => c.id !== id));
  };

    const ItemModal = ({
      item,
      onSave,
      onCancel,
    }: {
      item: CatalogItem | null;
      onSave: (it: CatalogItem) => void;
      onCancel: () => void;
    }) => {
      const [formData, setFormData] = useState<Partial<CatalogItem>>(
        item ?? { nombre: "", tipo: "Servicio", precio: 0 }
      );
      const t = useTranslations();

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setFormData(
        (prev) => ({
          ...(prev || {}),
          [name]: name === "precio" ? Number(value) : value,
        }) as Partial<CatalogItem>
      );
    };

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-20">
        <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h2 className="text-lg font-semibold mb-4">
              {item ? "Editar" : t.catalog.add} {t.catalog.title}
            </h2>
            <div className="space-y-3">
              <label htmlFor="item-nombre" className="text-sm">
                {t.catalog.name}
              </label>
              <input
                id="item-nombre"
                name="nombre"
                value={formData.nombre ?? ""}
                onChange={handleChange}
                placeholder={t.catalog.name}
                aria-label={t.catalog.name}
                className="w-full rounded-xl border px-3 py-2"
              />
              <label htmlFor="item-tipo" className="text-sm">
                {t.catalog.type}
              </label>
              <select
                id="item-tipo"
                name="tipo"
                value={formData.tipo ?? "Servicio"}
                onChange={handleChange}
                className="w-full rounded-xl border px-3 py-2"
                aria-label={t.catalog.type}
              >
                <option>{t.catalog.service}</option>
                <option>{t.catalog.part}</option>
              </select>
              <label htmlFor="item-precio" className="text-sm">
                {t.catalog.price}
              </label>
              <input
                id="item-precio"
                name="precio"
                type="number"
                value={formData.precio ?? 0}
                onChange={handleChange}
                placeholder={t.catalog.price}
                aria-label={t.catalog.price}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-xl border">
              Cancelar
            </button>
            <button
              onClick={() =>
                onSave({
                  id: item?.id ?? `item-${Date.now()}`,
                  nombre: formData.nombre || "",
                  tipo: (formData.tipo as CatalogItem["tipo"]) || "Servicio",
                  precio:
                    typeof formData.precio === "number"
                      ? formData.precio
                      : Number(formData.precio || 0),
                })
              }
              className="px-4 py-2 rounded-xl text-white"
              style={{ background: PALETTE.blue }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6">
      {showModal && (
        <ItemModal
          item={currentItem}
          onSave={handleSave}
          onCancel={() => {
            setShowModal(false);
            setCurrentItem(null);
          }}
        />
      )}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">{t.catalog.title}</h1>
          <button
            onClick={() => {
              setCurrentItem(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
            style={{ background: PALETTE.blue }}
          >
            <PlusCircle className="h-5 w-5" /> {t.catalog.add}
          </button>
        </div>
      <div className="rounded-2xl border bg-white p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">{t.catalog.name}</th>
                <th className="text-left p-2">{t.catalog.type}</th>
                <th className="text-right p-2">{t.catalog.price}</th>
                <th className="text-right p-2">{t.catalog.actions}</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((item) => (
              <tr key={item.id} className="border-b hover:bg-slate-50">
                <td className="p-2">{item.nombre}</td>
                <td className="p-2">{item.tipo}</td>
                <td className="p-2 text-right">
                  {currency.format(item.precio)}
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => {
                      setCurrentItem(item);
                      setShowModal(true);
                    }}
                    className="p-1 text-slate-500 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

