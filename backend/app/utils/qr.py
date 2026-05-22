import qrcode
import base64
from io import BytesIO


def generate_qr_code(data: str) -> str:
    """Generate a QR code and return it as a base64-encoded PNG string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def get_registrant_qr_data(registrant_id: int, email: str) -> str:
    """Format the data to encode in the registrant's QR code."""
    return f"NUP-CONVENTION-2025:{registrant_id}:{email}"
