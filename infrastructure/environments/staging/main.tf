# Staging environment — placeholder
# Add provider and resources when ready to provision. Do not apply until approved.

terraform {
  required_version = ">= 1.0"

  # Uncomment and configure when using remote state
  # backend "s3" {
  #   bucket = "your-tfstate-bucket"
  #   key    = "smile-transformation/staging/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Placeholder — no resources created
output "env" {
  value     = "staging"
  description = "Environment name (placeholder)."
}
