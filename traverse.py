import os
import argparse

def create_new_output_file(base_name, file_number):
    return f"{base_name}_{file_number}.txt"

def collect_files(directory, output_base_name, extensions=None, line_limit=7000):  # Changed to 3000
    file_number = 1
    current_line_count = 0
    outfile = open(create_new_output_file(output_base_name, file_number), 'w', encoding='utf-8')
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')  # This prevents os.walk from traversing into 'node_modules'
        for file in files:
            if extensions is None or file.endswith(tuple(extensions)):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, directory)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        content_lines = content.splitlines()
                        
                        # Check if adding this file would exceed the line limit
                        if current_line_count + len(content_lines) + 3 > line_limit and current_line_count > 0:
                            outfile.close()
                            file_number += 1
                            outfile = open(create_new_output_file(output_base_name, file_number), 'w', encoding='utf-8')
                            current_line_count = 0
                        
                        outfile.write(f"\n\n--- File: {relative_path} ---\n\n")
                        outfile.write(content)
                        outfile.write("\n")  # Add a newline after each file
                        
                        current_line_count += len(content_lines) + 3  # +3 for the header and extra newlines
                        
                except Exception as e:
                    outfile.write(f"Error reading file {relative_path}: {str(e)}\n")
                    current_line_count += 1
    
    outfile.close()
    print(f"Collection complete. Created {file_number} output files.")

def main():
    parser = argparse.ArgumentParser(description="Collect files from a directory and its subdirectories into multiple output files.")
    parser.add_argument("-d", "--directory", default=".", help="The directory to search for files (default: current directory)")
    parser.add_argument("-o", "--output", default="collected_files", help="Base name for output files (default: collected_files)")
    parser.add_argument("-e", "--extensions", nargs='+', help="File extensions to include (default: all files)")
    parser.add_argument("-l", "--line-limit", type=int, default=7000, help="Maximum number of lines per output file (default: 3000)")  # Changed to 3000
    
    args = parser.parse_args()
    
    directory = os.path.abspath(args.directory)
    
    if not os.path.isdir(directory):
        print(f"Error: {directory} is not a valid directory.")
        return

    collect_files(directory, args.output, args.extensions, args.line_limit)

if __name__ == "__main__":
    main()
