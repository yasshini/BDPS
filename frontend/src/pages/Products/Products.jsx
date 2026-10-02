import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Package, Plus, Trash2, X } from "lucide-react";
import { api } from "../../api/api";
import { formatMoney } from "../../utils/shared";
import { EmptyState, PageHeading } from "../BillHistory/BillHistory";
import { Field, SectionTitle } from "../CreateBill/CreateBill";

export function ProductsPage({
  products,
  onRefresh,
  onQuietRefresh,
  notify,
  isAdmin,
  onRequireAdmin,
}) {
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productPendingDelete, setProductPendingDelete] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [form, setForm] = useState({
    item_name: "",
    default_price: "",
    stock_quantity: "0",
  });
  const [stockInputs, setStockInputs] = useState({});

  function guardAdminAction() {
    if (isAdmin) return true;
    onRequireAdmin?.();
    return false;
  }

  useEffect(() => {
    if (!productPendingDelete) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setProductPendingDelete(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [productPendingDelete]);

  async function createProduct(event) {
    event.preventDefault();
    if (!guardAdminAction()) return;
    if (!form.item_name.trim()) {
      notify("error", "Enter a product name.");
      return;
    }
    const stockQuantity = Number(form.stock_quantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      notify("error", "Stock must be a whole number of zero or more.");
      return;
    }
    setIsSaving(true);
    try {
      const isEditingProduct = Boolean(editingProductId);
      const productData = {
        item_name: form.item_name.trim(),
        default_price: Number(form.default_price),
      };
      if (editingProductId) {
        await api.updateProduct(editingProductId, {
          ...productData,
          stock_quantity: stockQuantity,
        });
      } else {
        await api.createProduct({
          ...productData,
          stock_quantity: stockQuantity,
        });
      }
      setForm({ item_name: "", default_price: "", stock_quantity: "0" });
      setEditingProductId(null);
      setShowForm(false);
      if (isEditingProduct) {
        await onQuietRefresh();
      } else {
        await onRefresh("Product added.");
      }
    } catch (error) {
      notify("error", error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function adjustStock(product, direction) {
    if (!guardAdminAction()) return;
    const quantity = Number(stockInputs[product.id] || 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
      notify(
        "error",
        "Enter a positive whole number for the stock adjustment.",
      );
      return;
    }
    try {
      await api.adjustStock(product.id, quantity, direction);
      setStockInputs((current) => ({ ...current, [product.id]: "" }));
      await onQuietRefresh();
    } catch (error) {
      notify("error", error.message);
    }
  }

  async function deleteProduct(product) {
    if (!guardAdminAction()) return;
    setIsDeletingProduct(true);
    try {
      await api.deleteProduct(product.id);
      await onRefresh("Product deleted from active inventory.");
      setProductPendingDelete(null);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setIsDeletingProduct(false);
    }
  }

  function editProduct(product) {
    if (!guardAdminAction()) return;
    setEditingProductId(product.id);
    setForm({
      item_name: product.item_name,
      default_price: String(product.default_price),
      stock_quantity: String(product.stock_quantity),
    });
    setShowForm(true);
  }

  function toggleAddForm() {
    if (!showForm && !guardAdminAction()) return;
    if (showForm) {
      setShowForm(false);
      setEditingProductId(null);
      setForm({ item_name: "", default_price: "", stock_quantity: "0" });
    } else {
      setEditingProductId(null);
      setForm({ item_name: "", default_price: "", stock_quantity: "0" });
      setShowForm(true);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="INVENTORY"
        title="Products"
        description="Manage parts, selling prices and available stock."
        action={
          <button
            aria-disabled={!isAdmin}
            className={`button button-primary${isAdmin ? "" : " action-locked"}`}
            onClick={toggleAddForm}
            type="button"
          >
            {showForm ? <X size={17} /> : <Plus size={18} />}
            {showForm ? "Close" : "Add product"}
          </button>
        }
      />
      {showForm && (
        <section className="surface-card form-card">
          <SectionTitle
            icon={Package}
            title={editingProductId ? "Edit product" : "Add a product"}
          />
          <form className="inline-form" onSubmit={createProduct}>
            <Field label="Product name" required>
              <input
                maxLength="100"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    item_name: event.target.value,
                  }))
                }
                required
                value={form.item_name}
              />
            </Field>
            <Field label="Price (₹)" required>
              <input
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    default_price: event.target.value,
                  }))
                }
                required
                step="0.01"
                type="number"
                value={form.default_price}
              />
            </Field>
            <Field
              label={editingProductId ? "Current stock" : "Opening stock"}
              required
            >
              <input
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stock_quantity: event.target.value,
                  }))
                }
                required
                type="number"
                value={form.stock_quantity}
              />
            </Field>
            <button
              className="button button-primary inline-submit"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? editingProductId
                  ? "Saving…"
                  : "Adding…"
                : editingProductId
                  ? "Save changes"
                  : "Add product"}
            </button>
          </form>
        </section>
      )}
      <section className="surface-card">
        <div className="section-heading">
          <div>
            <h2>Product list</h2>
          </div>
          <span className="live-indicator">
            <i /> Live
          </span>
        </div>
        {products.length ? (
          <div className="table-scroll">
            <table className="data-table product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Adjust stock</th>
                  <th>Actions</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td data-label="Product">
                      <div className="table-product">
                        <strong>{product.item_name}</strong>
                      </div>
                    </td>
                    <td data-label="Price">
                      <span className="product-price-amount">
                        {formatMoney(product.default_price)}
                      </span>
                    </td>
                    <td data-label="Adjust stock">
                      <div className="stock-add-form">
                        <input
                          aria-label={`Number of units to adjust for ${product.item_name}`}
                          min="1"
                                          disabled={!isAdmin}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              adjustStock(product, "add");
                            }
                          }}
                          onChange={(event) =>
                            setStockInputs((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                          placeholder="Qty"
                          type="number"
                          value={stockInputs[product.id] ?? ""}
                        />
                        <button
                          aria-label={`Increase ${product.item_name} stock`}
                          className={`stock-adjust-button increase${isAdmin ? "" : " action-locked"}`}
                          aria-disabled={!isAdmin}
                          onClick={() => adjustStock(product, "add")}
                          type="button"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          aria-label={`Decrease ${product.item_name} stock`}
                          className={`stock-adjust-button decrease${isAdmin ? "" : " action-locked"}`}
                          aria-disabled={!isAdmin}
                          onClick={() => adjustStock(product, "remove")}
                          type="button"
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="table-action" data-label="Actions">
                      <div className="row-actions">
                        <button
                          aria-disabled={!isAdmin}
                          className={`quiet-button${isAdmin ? "" : " action-locked"}`}
                          onClick={() => editProduct(product)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          aria-disabled={!isAdmin}
                          className={`quiet-button destructive${isAdmin ? "" : " action-locked"}`}
                          onClick={() => setProductPendingDelete(product)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td data-label="Stock">
                      <span className="stock-badge">
                        {product.stock_quantity} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No products yet"
            message="Add a product to start tracking stock."
          />
        )}
      </section>
      {productPendingDelete && (
        <div
          className="confirm-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setProductPendingDelete(null);
            }
          }}
        >
          <section
            aria-labelledby="delete-product-title"
            aria-modal="true"
            className="confirm-dialog"
            role="dialog"
          >
            <span className="confirm-icon">
              <Trash2 size={20} />
            </span>
            <h2 id="delete-product-title">Delete this product?</h2>
            <p>
              <strong>{productPendingDelete.item_name}</strong> will be removed
              from active inventory. Past bills will remain unchanged.
            </p>
            <div className="confirm-actions">
              <button
                className="button button-subtle"
                onClick={() => setProductPendingDelete(null)}
                type="button"
              >
                Keep product
              </button>
              <button
                className="button button-danger"
                disabled={isDeletingProduct}
                onClick={() => deleteProduct(productPendingDelete)}
                type="button"
              >
                {isDeletingProduct ? "Deleting…" : "Delete product"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
