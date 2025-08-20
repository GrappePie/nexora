from backend.app.db import SessionLocal
from backend.app.models import StockORM, InvoiceORM


def test_stock_and_invoice_insert_and_query():
    db = SessionLocal()
    try:
        stock = StockORM(item="Widget", quantity=5, unit_price=2.0)
        invoice = InvoiceORM(customer="ACME", total=10.0)
        db.add_all([stock, invoice])
        db.commit()
        db.refresh(stock)
        db.refresh(invoice)
        s = db.get(StockORM, stock.id)
        i = db.get(InvoiceORM, invoice.id)
        assert s is not None and s.item == "Widget"
        assert i is not None and i.customer == "ACME" and i.total == 10.0
    finally:
        db.close()
