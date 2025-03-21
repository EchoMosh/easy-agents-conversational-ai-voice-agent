import pandas as pd
import re

# Load the CSV - using the correct path to the file
file_path = "../Downloads/Untitled spreadsheet - Master CEO List Cleaned (2025) - Is Your Stock Invisible?_valid.csv"
df = pd.read_csv(file_path)

# Common suffixes to remove
suffixes_raw = [
    r'inc\.?', 
    r'corp\.?', 
    r'corporation',
    r'holdings',
    r'group',
    r'company',
    r'co\.?',
    r'ltd\.?',
    r'llc',
    r'plc',
    r'ag',
    r'n\.?v\.?',
    r's\.?p\.?a\.?',
    r's\.?a\.?(?:\.?s\.?)?',
    r'lp',
    r'llp',
    r'incorporated',
    r'international',
    r'hldg\.?',
]

# Compile regex patterns for efficiency
suffixes_compiled = [re.compile(r'(\s|^)'+suf+r'(\.|,|\s|$)', re.IGNORECASE) for suf in suffixes_raw]

def make_natural_company_name(name):
    # Remove anything in parentheses
    name = re.sub(r"\(.*?\)", "", name)
    
    # Remove each known suffix until none remain
    changed = True
    while changed:
        changed = False
        for pattern in suffixes_compiled:
            new_name = re.sub(pattern, ' ', name)
            if new_name != name:
                name = new_name
                changed = True
                
    # Clean up extra spaces and remove trailing punctuation
    name = re.sub(r'\s+', ' ', name).strip()
    name = re.sub(r'[.,]+$', '', name)
    return name

# Apply the transformation
df["Natural_Company_Name"] = df["Company"].apply(make_natural_company_name)

# Print a preview of the results
print("Preview of the first 15 transformations:")
print(df[["Company", "Natural_Company_Name"]].head(15))

# Save the results to a new CSV file
output_file = "../Downloads/CEO_List_with_Natural_Company_Names.csv"
df.to_csv(output_file, index=False)
print(f"\nFull dataset with natural company names saved to: {output_file}")
