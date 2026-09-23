package com.bit.backend.dtos;

import java.util.List;

/**
 * Matches the previous institute API envelope: { "data": { "dataList": [...] } }
 */
public class ApiListResponse<T> {
    private ApiData<T> data;

    public ApiListResponse() {
    }

    public ApiListResponse(List<T> dataList) {
        this.data = new ApiData<>(dataList);
    }

    public static <T> ApiListResponse<T> of(List<T> dataList) {
        return new ApiListResponse<>(dataList);
    }

    public static <T> ApiListResponse<T> ofOne(T item) {
        return new ApiListResponse<>(List.of(item));
    }

    public ApiData<T> getData() {
        return data;
    }

    public void setData(ApiData<T> data) {
        this.data = data;
    }

    public static class ApiData<T> {
        private List<T> dataList;

        public ApiData() {
        }

        public ApiData(List<T> dataList) {
            this.dataList = dataList;
        }

        public List<T> getDataList() {
            return dataList;
        }

        public void setDataList(List<T> dataList) {
            this.dataList = dataList;
        }
    }
}
