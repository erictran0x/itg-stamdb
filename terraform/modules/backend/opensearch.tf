resource "bonsai_cluster" "this" {
  name = "itgstamdb-titles-cluster"

  plan = {
    slug = "sandbox"
  }

  space = {
    path = "omc/bonsai/us-east-1/common"
  }

  release = {
    slug = "opensearch-2.19.2"
  }
}

output "bonsai_cluster_host" {  
  value = bonsai_cluster.this.access.host  
}  
  
output "bonsai_cluster_port" {  
  value = bonsai_cluster.this.access.port
}  

output "bonsai_cluster_user" {  
  value = bonsai_cluster.this.access.user  
  sensitive = true  
}  
  
output "bonsai_cluster_password" {  
  value = bonsai_cluster.this.access.password  
  sensitive = true  
}  