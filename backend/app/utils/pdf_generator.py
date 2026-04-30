from datetime import datetime
from fpdf import FPDF
import io

# Color Palette
COLOR_DARK_BLUE = (30, 58, 138)
COLOR_LIGHT_BLUE = (240, 247, 255)
COLOR_DIVIDER_BLUE = (191, 219, 254)
COLOR_TEXT_GRAY = (31, 41, 55)
COLOR_BG_GRAY = (243, 244, 246)
COLOR_SLATE_LITE = (100, 116, 139)

def clean_pdf_text(text):
    if not text:
        return ""
    # Map of common Unicode characters to Latin-1/ASCII equivalents
    replacements = {
        "\u2018": "'", "\u2019": "'",  # Smart single quotes
        "\u201c": '"', "\u201d": '"',  # Smart double quotes
        "\u2013": "-", "\u2014": "-",  # En/Em dashes
        "\u00a0": " ",                  # Non-breaking space
        "\u2026": "...",               # Ellipsis
    }
    cleaned = str(text)
    for u_char, r_char in replacements.items():
        cleaned = cleaned.replace(u_char, r_char)
    
    # Final fallback: encode to latin-1 and replace unknown chars with '?'
    return cleaned.encode("latin-1", "replace").decode("latin-1")

class QuetraPDF(FPDF):
    def __init__(self, title_type="FACTURE", ref="", date_str="", client=None, due_date=None):
        super().__init__()
        self.title_type = title_type
        self.ref = ref
        self.date_str = date_str
        self.client = client
        self.due_date = due_date
        self.set_auto_page_break(auto=True, margin=15)
        self.add_page()
        
    def _clean(self, text):
        return clean_pdf_text(text)

    def _draw_logo(self, x, y, size=10, color=None):
        if color:
            self.set_fill_color(*color)
        else:
            self.set_fill_color(*COLOR_SLATE_LITE)
            
        # Diamond vertices
        pts = [
            (x + size/2, y),        # Top
            (x + size, y + size/2), # Right
            (x + size/2, y + size), # Bottom
            (x, y + size/2)         # Left
        ]
        self.polygon(pts, style="F")
        
        # Draw the "Q" tail at bottom-right (diagonal stroke)
        tail_pts = [
            (x + size * 0.75, y + size * 0.75),
            (x + size * 1.05, y + size * 1.05),
            (x + size * 0.95, y + size * 1.15),
            (x + size * 0.65, y + size * 0.85)
        ]
        self.polygon(tail_pts, style="F")
        
        # Inner cutout placeholder
        self.set_fill_color(255, 255, 255)
        self.rect(x + size/3, y + size/3, size/3, size/3, "F")

    def _draw_stamp(self, x, y):
        # Professional Stamp Blue
        STAMP_BLUE = (37, 99, 235) 
        self.set_draw_color(*STAMP_BLUE)
        self.set_line_width(0.6)
        # Outer circle
        self.ellipse(x, y, 38, 38, style="D")
        
        self.set_text_color(*STAMP_BLUE)
        self.set_font("helvetica", "B", 8)
        
        # Top text
        self.set_xy(x + 4, y + 5)
        self.cell(30, 5, self._clean("Quetratech"), align="C")
        
        # Middle refined Logo
        self._draw_logo(x + 14, y + 13, 10, color=STAMP_BLUE)
        
        # Bottom curvy text (approximated with multi_cell)
        self.set_font("helvetica", "", 5)
        self.set_xy(x + 2, y + 26)
        self.multi_cell(34, 2.5, self._clean("BN11 Pépinière d'entreprise\nAvenue El mouraouj Mahdia"), align="C")
        
        self.set_line_width(0.2) # Reset
        self.set_text_color(*COLOR_TEXT_GRAY) # Reset

    def header(self):
        # Background elements or logos could go here
        # For now, let's stick to the structure in the image
        pass

    def draw_template_header(self):
        # Logo placeholder (Top Left)
        self._draw_logo(10, 10, 9)
        self.set_font("helvetica", "B", 18)
        self.set_text_color(*COLOR_SLATE_LITE)
        self.set_xy(20, 9)
        self.cell(50, 10, "QuetraTech", ln=False)
        
        # Company Info (Left)
        self.set_font("helvetica", "", 10)
        self.set_text_color(*COLOR_TEXT_GRAY)
        self.set_xy(10, 28)
        self.cell(0, 5, "Ste Quetratech", ln=True)
        self.set_font("helvetica", "B", 10)
        self.cell(0, 5, self._clean(f"Code TVA: 1694357R"), ln=True)
        self.set_font("helvetica", "", 10)
        self.cell(0, 5, self._clean(f"Email: contact@quetratech.com"), ln=True)
        self.cell(0, 5, self._clean(f"Tel: +21623564077"), ln=True)
        
        # Invoice/Quote Info (Right)
        if self.client:
            self.set_xy(135, 28)
            self.set_font("helvetica", "B", 10)
            self.cell(25, 5, "Client:", ln=False)
            self.set_font("helvetica", "", 10)
            self.cell(0, 5, self._clean(self.client.nom), ln=True)
            
            self.set_x(135)
            self.set_font("helvetica", "B", 10)
            self.cell(25, 5, "Code TVA:", ln=False)
            self.set_font("helvetica", "", 10)
            self.cell(0, 5, self._clean(self.client.matriculeFiscale or "----"), ln=True)
            
            self.set_x(135)
            self.set_font("helvetica", "B", 10)
            self.cell(25, 5, "Date:", ln=False)
            self.set_font("helvetica", "", 10)
            self.cell(0, 5, self.date_str, ln=True)
            
            self.set_x(135)
            self.set_font("helvetica", "B", 10)
            self.cell(25, 5, self._clean(f"{self.title_type} num:"), ln=False)
            self.set_font("helvetica", "", 10)
            self.cell(0, 5, self._clean(self.ref), ln=True)

        self.ln(10)
        # Horizontal divider above table
        self.set_draw_color(*COLOR_DIVIDER_BLUE)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def draw_items_table(self, items):
        w_desc = 150
        w_total = 40
        
        for item in items:
            desc = item.description.strip()
            
            if desc.startswith("#"):
                # Section Header
                section_title = desc.lstrip("# ").strip()
                self.set_fill_color(*COLOR_LIGHT_BLUE)
                self.set_font("helvetica", "B", 11)
                self.set_text_color(*COLOR_DARK_BLUE)
                self.cell(w_desc, 9, self._clean(f"  # {section_title}"), border="T", fill=True)
                # Check if it should be Total or Total HT based on title_type
                total_label = "Total HT" if self.title_type == "FACTURE" else "Total"
                self.cell(w_total, 9, self._clean(total_label), border="T", fill=True, align="C")
                self.ln()
                self.set_text_color(*COLOR_TEXT_GRAY) # Reset color
            else:
                # Regular Item
                self.set_font("helvetica", "", 10)
                start_y = self.get_y()
                # Use multi_cell for description
                self.set_x(10)
                self.multi_cell(w_desc, 7, self._clean(desc), border=0)
                end_y = self.get_y()
                row_h = end_y - start_y
                
                # Draw the right "Total" cell background and text
                self.set_xy(10 + w_desc, start_y)
                self.set_fill_color(*COLOR_BG_GRAY)
                label_val = "Inclus" if not hasattr(item, 'lineTotal') or item.lineTotal == 0 else f"{item.lineTotal:,.3f}"
                self.cell(w_total, row_h, self._clean(label_val), border=0, fill=True, align="C")
                self.set_y(end_y)
                
            # Horizontal divider between rows
            self.set_draw_color(*COLOR_DIVIDER_BLUE)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(1)

    def draw_footer_and_totals(self, amount_ht, tax_rate, amount_ttc, currency="Dt"):
        self.ln(10)
        curr_y = self.get_y()
        
        # Left side: Payment conditions
        self.set_font("helvetica", "B", 11)
        self.cell(0, 6, self._clean("Conditions de paiement"), ln=True)
        self.set_font("helvetica", "", 10)
        self.cell(0, 5, self._clean("IBAN : TN59 04502040007862933473"), ln=True)
        self.cell(0, 5, self._clean("BIC : BSTUTNTT"), ln=True)
        self.cell(0, 5, self._clean("BANQUE : ATTIJARI BANK TUNISIE"), ln=True)
        
        # Timbre (Bottom Left box style)
        self.set_y(curr_y + 30)
        self.set_fill_color(*COLOR_LIGHT_BLUE)
        self.set_font("helvetica", "B", 11)
        self.cell(50, 10, self._clean("  Timbre"), border=1, fill=True)
        self.set_font("helvetica", "", 11)
        self.cell(15, 10, self._clean("1 Dt"), border=1, align="C")
        
        # Right side: Totals (Box style)
        self.set_xy(120, curr_y)
        self.set_fill_color(*COLOR_BG_GRAY)
        
        # Stamp (Center)
        self._draw_stamp(80, curr_y + 10)
        
        # Total HT
        self.set_x(120)
        self.set_font("helvetica", "B", 11)
        self.cell(40, 10, self._clean(" Total HT"), border="LTB", fill=True)
        self.set_font("helvetica", "", 11)
        self.cell(30, 10, self._clean(f"{amount_ht:,.3f} {currency}"), border="RTB", align="R")
        self.ln()
        
        # TVA
        self.set_x(120)
        self.set_fill_color(255, 255, 255) # White BG
        self.set_font("helvetica", "B", 11)
        self.cell(40, 10, self._clean(" TVA"), border="LTB")
        self.set_font("helvetica", "", 11)
        self.cell(30, 10, self._clean(f"{tax_rate}%"), border="RTB", align="R")
        self.ln()
        
        # Total TTC
        self.set_x(120)
        self.set_font("helvetica", "B", 11)
        self.set_fill_color(*COLOR_LIGHT_BLUE)
        self.cell(40, 10, self._clean(" Total TTC"), border="LTB", fill=True)
        self.set_font("helvetica", "B", 12)
        self.cell(30, 10, self._clean(f"{amount_ttc:,.3f} {currency}"), border="RTB", fill=True, align="R")
        
        # Stamp Placeholder (Centered at bottom)
        # self.image("stamp.png", 90, 230, 40)
        
    def draw_final_footer(self):
        self.set_y(-18)
        self.set_font("helvetica", "", 8)
        self.set_text_color(107, 114, 128)
        footer_text = "Ste Quetratech - Code TVA:1694357R - email: contact@quetratech.com- tel: +21623564077"
        self.cell(0, 10, self._clean(footer_text), align="L")
        # Draw small bottom logo on the right
        self._draw_logo(180, 280, 4)
        self.set_xy(185, 277)
        self.set_font("helvetica", "B", 8)
        self.cell(20, 10, "QuetraTech", align="R")

def generate_pdf(title_type, ref, date_str, client, items, amount_ht, tax_rate, amount_ttc, currency="Dt"):
    pdf = QuetraPDF(title_type, ref, date_str, client)
    pdf.draw_template_header()
    pdf.draw_items_table(items)
    pdf.draw_footer_and_totals(amount_ht, tax_rate, amount_ttc, currency)
    pdf.draw_final_footer()
    return pdf.output()
