import { useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Gauge,
  Plus,
  Receipt,
  Trash2,
  Wrench,
} from "lucide-react";
import { api } from "../../api/api";
import { formatMoney } from "../../utils/shared";
import { PageHeading } from "../BillHistory/BillHistory";

export function CreateBillPage({
  customers,
  editingBill,
  onCancelEdit,
  onCreated,
  products,
  notify,
}) {
  const [customerName, setCustomerName] = useState(
    () => editingBill?.customer?.customer_name || "",
  );
  const [contactNumber, setContactNumber] = useState(
    () => editingBill?.customer?.contact_number || "",
  );
  const [bikeNumber, setBikeNumber] = useState(
    () => editingBill?.bike?.bike_number || "",
  );
  const [bikeModel, setBikeModel] = useState(
    () => editingBill?.bike?.bike_model || "",
  );
  const [matchedBike, setMatchedBike] = useState(null);
  const [bikeLookupStatus, setBikeLookupStatus] = useState("idle");
  const [kilometer, setKilometer] = useState(
    () => String(editingBill?.kilometer ?? ""),
  );
  const [paymentType, setPaymentType] = useState(
    () => editingBill?.payment_type || "CASH",
  );
  const [paidAmount, setPaidAmount] = useState(
    () => String(editingBill?.paid_amount ?? ""),
  );
  const [items, setItems] = useState(() =>
    editingBill?.items?.length
      ? editingBill.items.map((item) => ({
          product_id: item.product_id ? String(item.product_id) : "",
          product_name: item.item_name,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
          discount_percentage: Number(item.discount_percentage || 0),
        }))
      : [
          {
            product_id: "",
            product_name: "",
            quantity: 1,
            discount_percentage: 0,
          },
        ],
  );
  const [openProductRow, setOpenProductRow] = useState(null);
  const [expandedLineIndex, setExpandedLineIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const touchStartX = useRef(null);
  const bikeLookupVersion = useRef(0);

  const activeProducts = products.filter((product) => product.is_active);
  const itemSummary = items.map((item) => {
    const product = products.find(
      (entry) => String(entry.id) === String(item.product_id),
    );
    const unitPrice = Number(
      item.unit_price ?? product?.default_price ?? 0,
    );
    const quantity = Number(item.quantity || 0);
    const discountPercentage = Math.min(
      100,
      Math.max(0, Number(item.discount_percentage || 0)),
    );
    const lineSubtotal = unitPrice * quantity;
    const discountAmount = lineSubtotal * (discountPercentage / 100);

    return {
      name: product?.item_name || item.product_name || "Select a product",
      unitPrice,
      quantity,
      lineSubtotal,
      discountAmount,
      total: lineSubtotal - discountAmount,
      stockQuantity: product?.stock_quantity,
    };
  });
  const subtotal = itemSummary.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const discountTotal = itemSummary.reduce(
    (sum, item) => sum + item.discountAmount,
    0,
  );
  const invoiceTotal = subtotal - discountTotal;

  async function lookupBike(value) {
    const normalizedNumber = value.trim().toUpperCase();
    const lookupVersion = bikeLookupVersion.current + 1;
    bikeLookupVersion.current = lookupVersion;

    if (!normalizedNumber) {
      setMatchedBike(null);
      setBikeLookupStatus("idle");
      return null;
    }

    setBikeLookupStatus("checking");
    try {
      const bike = await api.getBikeByNumber(normalizedNumber);
      if (bikeLookupVersion.current !== lookupVersion) return null;

      if (bike) {
        setMatchedBike(bike);
        setBikeNumber(bike.bike_number);
        setBikeModel(bike.bike_model || "");
        setCustomerName(bike.customer?.customer_name || "");
        setContactNumber(bike.customer?.contact_number || "");
        setKilometer(
          bike.last_kilometer === null || bike.last_kilometer === undefined
            ? ""
            : String(bike.last_kilometer),
        );
        setBikeLookupStatus("found");
      } else {
        setMatchedBike(null);
        setBikeNumber(normalizedNumber);
        setKilometer("");
        setBikeLookupStatus("new");
      }
      return bike;
    } catch (error) {
      if (bikeLookupVersion.current === lookupVersion) {
        setBikeLookupStatus("error");
        notify("error", error.message);
      }
      throw error;
    }
  }

  function updateItem(index, key, value) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? key === "product_name"
            ? (() => {
                const product = activeProducts.find(
                  (entry) =>
                    entry.item_name.toLowerCase() ===
                    value.trim().toLowerCase(),
                );
                return {
                  ...item,
                  product_name: value,
                  product_id: product ? String(product.id) : "",
                  unit_price: product
                    ? Number(product.default_price)
                    : item.product_id
                      ? ""
                      : item.unit_price,
                };
              })()
            : { ...item, [key]: value }
          : item,
      ),
    );
  }

  function addItem() {
    setExpandedLineIndex(items.length);
    setItems((current) => [
      ...current,
      {
        product_id: "",
        product_name: "",
        unit_price: "",
        quantity: 1,
        discount_percentage: 0,
      },
    ]);
  }

  function removeItem(index) {
    if (items.length === 1) return;
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setExpandedLineIndex((current) =>
      current === index
        ? Math.max(0, index - 1)
        : current > index
          ? current - 1
          : current,
    );
  }

  function handleSwipeStart(event) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleSwipeMove(event) {
    if (touchStartX.current === null) return;
    const delta = event.touches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 8) {
      event.currentTarget.style.transform = `translateX(${Math.max(
        -100,
        Math.min(delta, 100),
      )}px)`;
    }
  }

  function handleSwipeEnd(event, index) {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    event.currentTarget.style.transform = "";

    if (Math.abs(delta) >= 70 && items.length > 1) {
      removeItem(index);
      notify("success", "Service item removed.");
    }
  }

  async function resolveBikeAndCustomer() {
    let bike = matchedBike;
    const normalizedNumber = bikeNumber.trim().toUpperCase();

    if (!bike || bike.bike_number.toUpperCase() !== normalizedNumber) {
      bike = await lookupBike(normalizedNumber);
    }

    if (bike) {
      if (!bike.customer_id || !bike.customer) {
        throw new Error(
          "The matching bike has no customer details. Update the bike record before billing.",
        );
      }

      return {
        customer_id: bike.customer_id,
        bike_id: bike.id,
      };
    }

    let customer = customers.find(
      (entry) =>
        entry.contact_number.replace(/\D/g, "") ===
        contactNumber.trim().replace(/\D/g, ""),
    );

    if (!customer) {
      const customerResponse = await api.createCustomer({
        customer_name: customerName.trim(),
        contact_number: contactNumber.trim(),
      });
      customer = customerResponse.data;
    }

    const bikeResponse = await api.createBike({
      customer_id: customer.id,
      bike_number: normalizedNumber,
      bike_model: bikeModel.trim(),
    });

    return {
      customer_id: customer.id,
      bike_id: bikeResponse.data.id,
    };
  }

  async function submitBill(event) {
    event.preventDefault();
    if (
      !customerName.trim() ||
      !contactNumber.trim() ||
      !bikeNumber.trim() ||
      !bikeModel.trim()
    ) {
      notify(
        "error",
        "Enter the customer name, contact number, bike registration and model.",
      );
      return;
    }
    if (!items.length || items.some((item) => !item.product_name.trim())) {
      notify("error", "Enter a product or service name for every bill line.");
      return;
    }
    if (
      items.some(
        (item) =>
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1,
      )
    ) {
      notify("error", "Each item must have a quantity of at least one.");
      return;
    }
    if (
      items.some(
        (item) =>
          !item.product_id &&
          (item.unit_price === "" ||
            !Number.isFinite(Number(item.unit_price)) ||
            Number(item.unit_price) < 0),
      )
    ) {
      notify("error", "Enter a valid manual amount for each custom service.");
      return;
    }
    const requestedStock = new Map();
    for (const item of items) {
      const product = products.find(
        (entry) => String(entry.id) === String(item.product_id),
      );
      if (!product) continue;
      const productId = String(product.id);
      const previousQuantity =
        editingBill?.items
          ?.filter(
            (billItem) => String(billItem.product_id) === productId,
          )
          .reduce(
            (total, billItem) => total + Number(billItem.quantity),
            0,
          ) || 0;
      const requested = requestedStock.get(productId);
      requestedStock.set(productId, {
        name: product.item_name,
        available:
          Number(product.stock_quantity || 0) + previousQuantity,
        quantity: (requested?.quantity || 0) + Number(item.quantity),
      });
    }
    for (const { name, available, quantity } of requestedStock.values()) {
      if (quantity > available) {
        notify(
          "error",
          `Only ${available} ${
            available === 1 ? "unit is" : "units are"
          } available for ${name}.`,
        );
        return;
      }
    }
    if (Number(paidAmount || 0) > invoiceTotal) {
      notify("error", "The paid amount cannot exceed the bill total.");
      return;
    }

    setIsSaving(true);
    try {
      const billData = {
        customer_id: editingBill?.customer_id,
        bike_id: editingBill?.bike_id,
        kilometer: Number(kilometer),
        service_datetime:
          editingBill?.service_datetime || new Date().toISOString(),
        payment_type: paymentType,
        paid_amount: Number(paidAmount || 0),
        items: items.map((item) => ({
          product_id: item.product_id || null,
          item_name: item.product_name.trim(),
          unit_price:
            item.unit_price === "" ? null : Number(item.unit_price),
          quantity: Number(item.quantity),
          discount_percentage: Number(item.discount_percentage || 0),
        })),
      };
      if (!editingBill) {
        const { customer_id, bike_id } = await resolveBikeAndCustomer();
        billData.customer_id = customer_id;
        billData.bike_id = bike_id;
      }
      const response = editingBill
        ? await api.updateInvoice(editingBill.id, billData)
        : await api.createInvoice(billData);
      await onCreated(response.data);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={editingBill ? "BILLING · EDIT" : "BILLING"}
        title={editingBill ? "Edit bill" : "Create a bill"}
        action={
          editingBill ? (
            <button
              className="button button-subtle"
              onClick={onCancelEdit}
              type="button"
            >
              Cancel edit
            </button>
          ) : null
        }
      />
      <form className="bill-layout" onSubmit={submitBill}>
        <div className="bill-form-column">
          <section className="surface-card form-section">
            <SectionTitle
              icon={Gauge}
              title="Customer & Bike details"
            />
            <div className="form-grid two-columns bill-customer-grid">
              <Field label="Bike Number" required>
                <input
                  autoCapitalize="characters"
                  maxLength="50"
                  onBlur={() => {
                    if (
                      !editingBill &&
                      bikeNumber.trim() &&
                      bikeLookupStatus !== "found"
                    ) {
                      lookupBike(bikeNumber).catch(() => {});
                    }
                  }}
                  onChange={(event) => {
                    const value = event.target.value.toUpperCase();
                    setBikeNumber(value);
                    setMatchedBike(null);
                    setBikeLookupStatus("idle");
                    setCustomerName("");
                    setContactNumber("");
                    setBikeModel("");
                  }}
                  //placeholder="Type registration, e.g. TN58AB1234"
                  readOnly={Boolean(editingBill)}
                  required
                  value={bikeNumber}
                />
              </Field>
              <Field label="Bike model" required>
                <input
                  maxLength="100"
                  onChange={(event) => setBikeModel(event.target.value)}
                  //placeholder="e.g. Honda Activa 6G"
                  readOnly={Boolean(matchedBike || editingBill)}
                  required
                  value={bikeModel}
                />
              </Field>
              <Field label="Customer name" required>
                <input
                  maxLength="100"
                  onChange={(event) => setCustomerName(event.target.value)}
                  //placeholder="Enter customer name"
                  readOnly={Boolean(matchedBike || editingBill)}
                  required
                  value={customerName}
                />
              </Field>
              <Field label="Contact number" required>
                <input
                  autoComplete="tel"
                  maxLength="20"
                  onChange={(event) => setContactNumber(event.target.value)}
                  //placeholder="Enter contact number"
                  readOnly={Boolean(matchedBike || editingBill)}
                  required
                  value={contactNumber}
                />
              </Field>
              <Field label="Kilometers" required>
                <input
                  aria-label="Odometer reading in kilometers; editable"
                  min="0"
                  onChange={(event) => setKilometer(event.target.value)}
                  //placeholder="Enter current odometer reading"
                  required
                  type="number"
                  value={kilometer}
                />
              </Field>
              <Field label="Payment method" required>
                <select
                  onChange={(event) => setPaymentType(event.target.value)}
                  value={paymentType}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="surface-card form-section">
            <SectionTitle
              icon={Wrench}
              title="Product & Services"
            />
            <div className="bill-line-list">
              {items.map((item, index) => {
                const selectedProduct = products.find(
                  (product) =>
                    String(product.id) === String(item.product_id),
                );
                const previouslyBilledQuantity = editingBill?.items
                  ?.filter(
                    (billItem) =>
                      String(billItem.product_id) === String(item.product_id),
                  )
                  .reduce(
                    (total, billItem) => total + Number(billItem.quantity),
                    0,
                  ) || 0;
                const quantityOnOtherLines = items.reduce(
                  (total, otherItem, otherIndex) =>
                    otherIndex !== index &&
                    String(otherItem.product_id) === String(item.product_id)
                      ? total + Number(otherItem.quantity || 0)
                      : total,
                  0,
                );
                const availableQuantity =
                  Math.max(
                    0,
                    Number(selectedProduct?.stock_quantity || 0) +
                      previouslyBilledQuantity -
                      quantityOnOtherLines,
                  );
                return (
                  <div
                    className={`bill-line${
                      expandedLineIndex === index ? " is-expanded" : ""
                    }`}
                    key={index}
                    onKeyDown={(event) => {
                      if (
                        items.length > 1 &&
                        (event.key === "Delete" || event.key === "Backspace") &&
                        !["INPUT", "SELECT", "TEXTAREA"].includes(
                          event.target.tagName,
                        )
                      ) {
                        event.preventDefault();
                        removeItem(index);
                      }
                    }}
                    onTouchCancel={(event) => {
                      touchStartX.current = null;
                      event.currentTarget.style.transform = "";
                    }}
                    onTouchEnd={(event) => handleSwipeEnd(event, index)}
                    onTouchMove={handleSwipeMove}
                    onTouchStart={handleSwipeStart}
                    tabIndex={0}
                  >
                    <button
                      aria-controls={`bill-line-fields-${index}`}
                      aria-expanded={expandedLineIndex === index}
                      className="bill-line-summary"
                      onClick={() =>
                        setExpandedLineIndex((current) =>
                          current === index ? null : index,
                        )
                      }
                      type="button"
                    >
                      <span className="bill-line-summary-copy">
                        <strong>{itemSummary[index].name}</strong>
                        <small>
                          Qty {itemSummary[index].quantity} ·{" "}
                          {formatMoney(itemSummary[index].unitPrice)} each
                        </small>
                      </span>
                      <strong className="bill-line-summary-total">
                        {formatMoney(itemSummary[index].total)}
                      </strong>
                      <ChevronDown
                        aria-hidden="true"
                        className="bill-line-summary-chevron"
                        size={16}
                      />
                    </button>
                    <div
                      className="bill-line-fields"
                      id={`bill-line-fields-${index}`}
                    >
                      <Field label={index === 0 ? "Product / Service" : "Product"}>
                      <div className="product-picker">
                        <input
                          aria-autocomplete="list"
                          aria-controls={`product-options-${index}`}
                          aria-expanded={openProductRow === index}
                          autoComplete="off"
                          onBlur={() => {
                            window.setTimeout(
                              () => setOpenProductRow(null),
                              120,
                            );
                          }}
                          onChange={(event) => {
                            updateItem(index, "product_name", event.target.value);
                            setOpenProductRow(index);
                          }}
                          onFocus={() => setOpenProductRow(index)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setOpenProductRow(null);
                            }
                            if (
                              event.key === "Enter" &&
                              openProductRow === index
                            ) {
                              const matchingProduct = activeProducts.find(
                                (product) =>
                                  product.item_name
                                    .toLowerCase()
                                    .includes(item.product_name.toLowerCase()),
                              );
                              if (matchingProduct) {
                                event.preventDefault();
                                updateItem(
                                  index,
                                  "product_name",
                                  matchingProduct.item_name,
                                );
                                setOpenProductRow(null);
                              }
                            }
                          }}
                          placeholder="Type or choose a product"
                          required
                          role="combobox"
                          value={item.product_name}
                        />
                        <button
                          aria-label="Show products"
                          className="product-picker-toggle"
                          onBlur={() => {
                            window.setTimeout(
                              () => setOpenProductRow(null),
                              120,
                            );
                          }}
                          onClick={() =>
                            setOpenProductRow((current) =>
                              current === index ? null : index,
                            )
                          }
                          type="button"
                        >
                          <ChevronDown size={16} />
                        </button>
                        {openProductRow === index && (
                          <div
                            className="product-picker-options"
                            id={`product-options-${index}`}
                            role="listbox"
                          >
                            {activeProducts
                              .filter((product) =>
                                product.item_name
                                  .toLowerCase()
                                  .includes(item.product_name.toLowerCase()),
                              )
                              .map((product) => (
                                <button
                                  aria-selected={
                                    String(product.id) ===
                                    String(item.product_id)
                                  }
                                  key={product.id}
                                  onMouseDown={(event) =>
                                    event.preventDefault()
                                  }
                                  onClick={() => {
                                    updateItem(
                                      index,
                                      "product_name",
                                      product.item_name,
                                    );
                                    setOpenProductRow(null);
                                  }}
                                  role="option"
                                  type="button"
                                >
                                  <span>{product.item_name}</span>
                                  <small>
                                    {formatMoney(product.default_price)}
                                  </small>
                                </button>
                              ))}
                            {activeProducts.filter((product) =>
                              product.item_name
                                .toLowerCase()
                                .includes(item.product_name.toLowerCase()),
                            ).length === 0 && (
                              <button
                                className="product-picker-custom"
                                onMouseDown={(event) =>
                                  event.preventDefault()
                                }
                                onClick={() => setOpenProductRow(null)}
                                role="option"
                                type="button"
                              >
                                <span>
                                  Use “{item.product_name || "service"}” as a
                                  custom service
                                </span>
                                <small>Enter amount below</small>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      </Field>
                      {!selectedProduct && item.product_name.trim() && (
                        <Field label="Manual unit amount" required>
                          <input
                            aria-label={`Manual amount for ${item.product_name}`}
                            min="0"
                            onChange={(event) =>
                              updateItem(
                                index,
                                "unit_price",
                                event.target.value,
                              )
                            }
                            placeholder="Enter service amount"
                            required
                            step="0.01"
                            type="number"
                            value={item.unit_price ?? ""}
                          />
                        </Field>
                      )}
                      <Field label="Quantity">
                        <input
                          aria-label={`Quantity for ${item.product_name || "service item"}; ${availableQuantity} available`}
                          max={selectedProduct ? availableQuantity : undefined}
                          min="1"
                          onChange={(event) => {
                            const quantity = event.target.value;
                            if (
                              selectedProduct &&
                              quantity !== "" &&
                              Number(quantity) > availableQuantity
                            ) {
                              notify(
                                "error",
                                `Only ${availableQuantity} ${
                                  availableQuantity === 1 ? "unit is" : "units are"
                                } available for ${selectedProduct.item_name}.`,
                              );
                              updateItem(
                                index,
                                "quantity",
                                String(availableQuantity),
                              );
                              return;
                            }
                            updateItem(index, "quantity", quantity);
                          }}
                          required
                          type="number"
                          value={item.quantity}
                        />
                      </Field>
                      <Field label="Discount %">
                      <input
                        max="100"
                        min="0"
                        onChange={(event) =>
                          updateItem(
                            index,
                            "discount_percentage",
                            event.target.value,
                          )
                        }
                        type="number"
                        value={item.discount_percentage}
                      />
                      </Field>
                      <div className="bill-line-price">
                        <span>Price/unit</span>
                        <strong>
                          {formatMoney(itemSummary[index].unitPrice)}
                        </strong>
                      </div>
                      <div className="bill-line-amount">
                        <span>Total</span>
                        <strong>
                          {formatMoney(itemSummary[index].total)}
                        </strong>
                      </div>
                      <button
                        aria-label={`Remove ${item.product_name || `service item ${index + 1}`}`}
                        className="bill-line-remove"
                        disabled={items.length === 1}
                        onClick={() => removeItem(index)}
                        title={
                          items.length === 1
                            ? "At least one service item is required"
                            : "Remove service item"
                        }
                        type="button"
                      >
                        <Trash2 size={15} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="button button-subtle add-line-button"
              onClick={addItem}
              type="button"
            >
              <Plus size={16} /> Add another item
            </button>
          </section>
        </div>

        <aside className="surface-card bill-summary">
          <div className="summary-header">
            <span className="summary-symbol">
              <Receipt size={20} />
            </span>
            <div>
              <h2>Bill summary</h2>
            </div>
          </div>
          <div className="bill-summary-items">
            <div className="bill-summary-title">
              <strong>Product summary</strong>
              <span>{items.length} {items.length === 1 ? "product" : "products"}</span>
            </div>
            <div className="bill-summary-table-wrap">
              <table className="bill-summary-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Discount</th>
                    <th className="align-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {itemSummary.map((item, index) => (
                    <tr key={`${index}-${item.name}`}>
                      <td className="bill-summary-item-name">
                        <strong>{item.name}</strong>
                        {item.discountAmount > 0 && (
                          <small>
                            {Number(items[index].discount_percentage)}% discount
                          </small>
                        )}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.lineSubtotal)}</td>
                      <td>− {formatMoney(item.discountAmount)}</td>
                      <td className="align-right">
                        <strong>{formatMoney(item.total)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bill-summary-breakdown">
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>− {formatMoney(discountTotal)}</strong>
            </div>
            <div className="bill-grand-total">
              <span>Total amount</span>
              <strong>{formatMoney(invoiceTotal)}</strong>
            </div>
          </div>
          <Field label="Amount paid">
            <input
              max={invoiceTotal}
              min="0"
              onChange={(event) => setPaidAmount(event.target.value)}
              placeholder={invoiceTotal.toFixed(2)}
              step="0.01"
              type="number"
              value={paidAmount}
            />
          </Field>
          <div className="summary-balance">
            <span>Balance due</span>
            <strong>
              {formatMoney(Math.max(0, invoiceTotal - Number(paidAmount || 0)))}
            </strong>
          </div>
          <button
            className="button button-primary button-wide"
            disabled={
              isSaving
            }
            type="submit"
          >
            {isSaving
              ? editingBill
                ? "Saving changes…"
                : "Saving bill…"
              : editingBill
                ? "Save changes"
                : "Save bill"}
            {!isSaving && <ArrowRight size={17} />}
          </button>
        </aside>
      </form>
    </>
  );
}

export function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="form-section-heading">
      {Icon && (
        <span className="section-heading-icon">
          <Icon size={16} aria-hidden="true" />
        </span>
      )}
      <div>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

export function Field({ label, required = false, children }) {
  return (
    <label className="form-field">
      <span>
        {label}
        {required && <i aria-hidden="true"> *</i>}
      </span>
      {children}
    </label>
  );
}
