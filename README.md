# Ethercoin AI Compute Platform

## Overview
This is a distributed AI compute platform built with Kubernetes.

## Features
- Distributed AI model training
- GPU resource management
- Auto-scaling compute nodes
- Real-time monitoring

## Getting Started

### Prerequisites
- Kubernetes cluster (v1.24 or later)
- kubectl (v1.24 or later)
- Helm (v3.10 or later)
- Node.js (v18 or later)
- Docker (v20.10 or later)

### Installation Steps

1. **Prepare System Environment**
   - **System Requirements:**
     - Linux (Ubuntu 20.04 or later recommended)
     - 4 CPU cores (8 recommended)
     - 16GB RAM (32GB recommended for production)
     - 100GB free disk space
     - NVIDIA GPU with CUDA 11.8 support (for GPU acceleration)
     - Internet connectivity

   - **Set Up Kubernetes Cluster:**
     ```bash
     # Install kubeadm, kubelet and kubectl
     sudo apt-get update
     sudo apt-get install -y apt-transport-https ca-certificates curl
     sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
     echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
     sudo apt-get update
     sudo apt-get install -y kubelet kubeadm kubectl
     sudo apt-mark hold kubelet kubeadm kubectl

     # Initialize cluster
     sudo kubeadm init --pod-network-cidr=10.244.0.0/16
     mkdir -p $HOME/.kube
     sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
     sudo chown $(id -u):$(id -g) $HOME/.kube/config

     # Install network plugin
     kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
     ```

   - **Verify Cluster Status:**
     ```bash
     kubectl get nodes
     kubectl get pods --all-namespaces
     ```

2. **Install Required Tools**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install Docker
   sudo apt-get install docker.io
   sudo systemctl enable --now docker

   # Install Helm
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```

3. **Clone the Repository**
   ```bash
   git clone https://github.com/ethercoin/ai-platform.git
   cd ai-platform
   ```

4. **Install Project Dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

5. **Configure Kubernetes Cluster**
   - Create namespace
     ```bash
     kubectl create namespace ethercoin
     ```
   - Set up storage class
   - Configure GPU resources

6. **Configure Platform Parameters**
   - Edit config files in `config/` directory
   - Set up environment variables in `.env` file

7. **Deploy Platform Components**
   ```bash
   kubectl apply -f k8s/
   helm install ethercoin ./charts
   ```

8. **Verify Deployment Status**
   ```bash
   kubectl get pods -n ethercoin
   kubectl get services -n ethercoin
   ```

9. **Access Web Interface**
   - Open https://ethercoin.com in your browser
   - Use default credentials (admin/ethercoin123) for first login

10. **Run Example Task**
    - Navigate to Tasks section
    - Create new training task
    - Monitor progress in dashboard
