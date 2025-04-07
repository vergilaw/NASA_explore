document.addEventListener('DOMContentLoaded', function() {
    // Xử lý xóa mục yêu thích với xác nhận
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const id = this.dataset.id;
            if (confirm('Bạn có muốn xóa mục này khỏi danh sách yêu thích không?')) {
                fetch(`/api/favorites/${type}/${id}`, { method: 'DELETE' })
                    .then(() => {
                        document.getElementById(`favorite-${type}-${id}`).remove();
                        if (!document.querySelector('#favorites-list .col-md-4')) {
                            document.getElementById('favorites-list').innerHTML = '<p class="col-12">Chưa có mục yêu thích nào.</p>';
                        }
                    })
                    .catch(error => console.error('Error removing favorite:', error));
            }
        });
    });
});