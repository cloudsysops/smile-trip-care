# Dev environment — placeholder
# Add provider and resources when ready to provision. Do not apply until approved.

terraform {
  required_version = ">= 1.0"

  # Uncomment and configure when using remote state
  # backend "s3" {
  #   bucket = "your-tfstate-bucket"
  #   key    = "smile-transformation/dev/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Placeholder — no resources created
# resource "null_resource" "placeholder" {
#   triggers = {
#     env = "dev"
#   }
# }

output "env" {
  value = "dev"
  description = "Environment name (placeholder)."
}
