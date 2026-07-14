import re

with open('index.html', 'r') as f:
    content = f.read()

# Define patterns to extract sections
s1_pattern = r'(    <!-- Why Map Pack Section -->.*?)(?=\n    <!-- GBP Graph Section -->)'
s2_pattern = r'(    <!-- GBP Graph Section -->.*?)(?=\n    <!-- Map Citations Section -->)'
s3_pattern = r'(    <!-- Map Citations Section -->.*?)(?=\n    <!-- Impact Numbers -->)'
s4_pattern = r'(    <!-- Impact Numbers -->.*?)(?=\n    <!-- Real Results Screenshots -->)'
s5_pattern = r'(    <!-- Real Results Screenshots -->.*?)(?=\n    <!-- Traffic Stats & AI Visibility Section -->)'
s6_pattern = r'(    <!-- Traffic Stats & AI Visibility Section -->.*?)(?=\n    <!-- Search Console Section -->)'
s7_pattern = r'(    <!-- Search Console Section -->.*?)(?=\n    <!-- Review Management -->)'

s1 = re.search(s1_pattern, content, re.DOTALL).group(1)
s2 = re.search(s2_pattern, content, re.DOTALL).group(1)
s3 = re.search(s3_pattern, content, re.DOTALL).group(1)
s4 = re.search(s4_pattern, content, re.DOTALL).group(1)
s5 = re.search(s5_pattern, content, re.DOTALL).group(1)
s6 = re.search(s6_pattern, content, re.DOTALL).group(1)
s7 = re.search(s7_pattern, content, re.DOTALL).group(1)

# Modify bg-light classes for alternating backgrounds
s1 = s1 # Power of Map Pack (already bg-light)
s3 = s3.replace('class="section bg-light scroll-reveal"', 'class="section scroll-reveal"') # Map Citations (make white)
s5 = s5 # Real Rankings (already bg-light)
s6 = s6 # Explosive Organic Growth (already white)
s7 = s7 # Consistent Search Visibility (already bg-light)
s2 = s2 # Explosive Call Volume (already white)
s4 = s4.replace('class="section scroll-reveal"', 'class="section bg-light scroll-reveal"') # Impact Numbers (make bg-light)

# Order
# 1. The Power of the Map Pack (s1)
# 2. Hyper-Local Citations (s3)
# 3. Real Rankings, Real Proof (s5)
# 4. Explosive Organic Growth (s6)
# 5. Consistent Search Visibility (s7)
# 6. Explosive Call Volume (s2)
# 7. Our Local Impact (s4)

new_blocks = "\n".join([s1, s3, s5, s6, s7, s2, s4])

# Replace the whole block in original content
start_idx = content.find('    <!-- Why Map Pack Section -->')
end_idx = content.find('    <!-- Review Management -->')

new_content = content[:start_idx] + new_blocks + "\n" + content[end_idx:]

with open('index.html', 'w') as f:
    f.write(new_content)

print("Reordering complete")
